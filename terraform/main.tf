provider "aws" {
  region     = "us-east-1"
}

provider "hcp" {}

terraform {
  backend "s3" {
    bucket = "txner-tf-state"
    key    = "txner-dev/terraform.tfstate"
    region = "us-east-1"
    profile = "txner-dev"
  }
}