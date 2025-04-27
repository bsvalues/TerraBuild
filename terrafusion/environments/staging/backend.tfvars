bucket         = "bcbs-terraform-state"
key            = "staging/terraform.tfstate"
region         = "us-west-2"
dynamodb_table = "bcbs-terraform-locks"
encrypt        = true