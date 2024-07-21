provider "aws" {
  profile = "txner-dev"
  region  = "us-east-1"
}

provider "hcp" {}

terraform {
  cloud {
    organization = "txner"

    workspaces {
      name = "txner-dev"
    }
  }
}

# DynamoDB

resource "aws_dynamodb_table" "txner_table" {
  name         = "TXNER_DEV"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"
  attribute {
    name = "PK"
    type = "S"
  }
  attribute {
    name = "SK"
    type = "S"
  }
  attribute {
    name = "ID"
    type = "S"
  }
  local_secondary_index {
    name            = "ID_LSI"
    projection_type = "ALL"
    range_key       = "ID"
  }
}

# APIGW

resource "aws_apigatewayv2_api" "txner-api" {
  name          = "txner-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "dev" {
  api_id      = aws_apigatewayv2_api.txner-api.id
  name        = "dev"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.txner_api_gw.arn

    format = jsonencode({
      requestId               = "$context.requestId"
      sourceIp                = "$context.identity.sourceIp"
      requestTime             = "$context.requestTime"
      protocol                = "$context.protocol"
      httpMethod              = "$context.httpMethod"
      resourcePath            = "$context.resourcePath"
      routeKey                = "$context.routeKey"
      status                  = "$context.status"
      responseLength          = "$context.responseLength"
      integrationErrorMessage = "$context.integrationErrorMessage"
      }
    )
  }
}

resource "aws_cloudwatch_log_group" "txner_api_gw" {
  name              = "/aws/api-gw/${aws_apigatewayv2_api.txner-api.name}"
  retention_in_days = 30
}

resource "aws_apigatewayv2_route" "health_route" {
  api_id    = aws_apigatewayv2_api.txner-api.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.apigwv2_lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "transaction_route" {
  api_id    = aws_apigatewayv2_api.txner-api.id
  route_key = "ANY /transaction"
  target    = "integrations/${aws_apigatewayv2_integration.apigwv2_lambda_integration.id}"
}

resource "aws_apigatewayv2_integration" "apigwv2_lambda_integration" {
  api_id             = aws_apigatewayv2_api.txner-api.id
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = aws_lambda_function.txner_lambda.invoke_arn
}

# Lambda

data "archive_file" "txner_lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/dist"
  output_path = "${path.module}/txner_lambda.zip"
}

resource "random_pet" "lambda_bucket_name" {
  prefix = "lambda"
  length = 4
}

resource "aws_s3_bucket" "lambda_bucket" {
  bucket        = random_pet.lambda_bucket_name.id
  force_destroy = true
}

resource "aws_s3_object" "txner_lambda_zip_object" {
  bucket = aws_s3_bucket.lambda_bucket.id
  key    = "txner_lambda.zip"
  source = data.archive_file.txner_lambda_zip.output_path
  etag   = filemd5(data.archive_file.txner_lambda_zip.output_path)
}

resource "aws_lambda_function" "txner_lambda" {
  function_name    = "TxnerLambda"
  s3_bucket        = aws_s3_bucket.lambda_bucket.id
  s3_key           = aws_s3_object.txner_lambda_zip_object.key
  runtime          = "nodejs20.x"
  handler          = "handler.handler"
  source_code_hash = data.archive_file.txner_lambda_zip.output_base64sha256
  role             = aws_iam_role.txner_lambda_exec.arn
  timeout          = 10
  memory_size      = 512

  environment {
    variables = {
      TABLE_NAME = "${aws_dynamodb_table.txner_table.name}"
    }
  }
}

# Cloudwatch

resource "aws_cloudwatch_log_group" "txner_lambda_log_group" {
  name              = "/aws/lambda/${aws_lambda_function.txner_lambda.function_name}"
  retention_in_days = 30
}


# IAM


resource "aws_iam_role" "txner_lambda_exec" {
  name = "txner_lambda"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Sid    = ""
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      }
    ]
  })
}

data "template_file" "txnerlambdapolicy" {
  template = file("${path.module}/policy.json")
}

resource "aws_iam_policy" "TxnerLambdaPolicy" {
  name        = "TxnerLambdaPolicy"
  path        = "/"
  description = "IAM policy for Txner lambda functions"
  policy      = data.template_file.txnerlambdapolicy.rendered
}

resource "aws_iam_role_policy_attachment" "txner_lambda_execPolicy" {
  role       = aws_iam_role.txner_lambda_exec.name
  policy_arn = aws_iam_policy.TxnerLambdaPolicy.arn
}

resource "aws_lambda_permission" "lambda_permission_from_apigw" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.txner_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.txner-api.execution_arn}/*/*"

}

# Allow API Gateway to push logs to CloudWatch
resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.main.arn
}

resource "aws_iam_role" "main" {
  name = "api-gateway-logs-role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "Service": "apigateway.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

}

resource "aws_iam_role_policy_attachment" "main" {
  role       = aws_iam_role.main.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}
