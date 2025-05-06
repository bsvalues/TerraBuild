bucket         = "terrabuild-terraform-state-prod"
key            = "terrabuild/prod/terraform.tfstate"
region         = "us-west-2"
encrypt        = true
dynamodb_table = "terrabuild-terraform-locks-prod"