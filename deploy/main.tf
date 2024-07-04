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

resource "aws_dynamodb_table" "txner_table" {
  name         = "txner"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "tx_id"
  attribute {
    name = "tx_id"
    type = "S"
  }
  # global_secondary_index {
  #   name            = "TxnerCategoryRatingIndex"
  #   hash_key        = "category"
  #   range_key       = "txner_rating"
  #   projection_type = "ALL"
  # }
}

resource "aws_api_gateway_rest_api" "txner_apigw" {
  name        = "txner_apigw"
  description = "TxnerAPI Gateway"
  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_resource" "txner" {
  rest_api_id = aws_api_gateway_rest_api.txner_apigw.id
  parent_id   = aws_api_gateway_rest_api.txner_apigw.root_resource_id
  path_part   = "txner"
}

resource "aws_api_gateway_method" "get_txner_health_method" {
  rest_api_id   = aws_api_gateway_rest_api.txner_apigw.id
  resource_id   = aws_api_gateway_resource.txner.id
  http_method   = "GET"
  authorization = "NONE"

}

resource "aws_api_gateway_deployment" "txnerapistageprod" {
  depends_on = [
    aws_api_gateway_integration.txner_lambda_integration
  ]
  rest_api_id = aws_api_gateway_rest_api.txner_apigw.id
  stage_name  = "prod"
}

resource "aws_api_gateway_method_settings" "get_txner_health_method_setting" {
  rest_api_id = aws_api_gateway_rest_api.txner_apigw.id
  stage_name  = aws_api_gateway_deployment.txnerapistageprod.stage_name
  method_path = "*/*"
  settings {
    logging_level      = "INFO"
    data_trace_enabled = true
    metrics_enabled    = true
  }
}


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

data "archive_file" "txner_lambda_zip" {
  type = "zip"

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

  etag = filemd5(data.archive_file.txner_lambda_zip.output_path)
}

resource "aws_lambda_function" "txner_lambda" {
  function_name = "TxnerLambda"

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = aws_s3_object.txner_lambda_zip_object.key

  runtime = "nodejs20.x"
  handler = "main.handler"

  source_code_hash = data.archive_file.txner_lambda_zip.output_base64sha256

  role = aws_iam_role.txner_lambda_exec.arn
}

resource "aws_cloudwatch_log_group" "txner_lambda_log_group" {
  name = "/aws/lambda/${aws_lambda_function.txner_lambda.function_name}"

  retention_in_days = 30
}



resource "aws_iam_role_policy_attachment" "txner_lambda_policy" {
  role       = aws_iam_role.txner_lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_api_gateway_integration" "txner_lambda_integration" {
  rest_api_id             = aws_api_gateway_rest_api.txner_apigw.id
  resource_id             = aws_api_gateway_method.get_txner_health_method.id
  http_method             = aws_api_gateway_method.get_txner_health_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.txner_lambda.invoke_arn
}

resource "aws_lambda_permission" "apigw-txner_lambda" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.txner_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.txner_apigw.execution_arn}/*/GET/txner"
}


# output "apigw_url" {
#   value=aws_api_gateway_deployment.txnerapistageprod.
# }
