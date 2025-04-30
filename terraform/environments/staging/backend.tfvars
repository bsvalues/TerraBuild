bucket         = "terrabuild-terraform-state-staging"
key            = "terraform.tfstate"
region         = "us-west-2"
dynamodb_table = "terrabuild-terraform-locks-staging"
encrypt        = true