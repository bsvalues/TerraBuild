bucket = "bcbs-terraform-state-prod"
key    = "bcbs-infrastructure/prod/terraform.tfstate"
region = "us-west-2"
dynamodb_table = "bcbs-terraform-locks-prod"
encrypt = true