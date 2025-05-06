bucket         = "terrabuild-terraform-state-staging"
key            = "terrabuild/staging/terraform.tfstate"
region         = "us-west-2"
encrypt        = true
dynamodb_table = "terrabuild-terraform-locks-staging"