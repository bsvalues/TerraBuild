bucket = "bcbs-terraform-state-staging"
key    = "bcbs-infrastructure/staging/terraform.tfstate"
region = "us-west-2"
dynamodb_table = "bcbs-terraform-locks-staging"
encrypt = true