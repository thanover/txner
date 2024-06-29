resource "aws_s3_bucket" "terraform_state" {
  bucket = "txner-tf-state"

  # Prevent accidental deletion of this S3 bucket
  lifecycle {
    prevent_destroy = true
  }
}

