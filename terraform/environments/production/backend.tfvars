bucket         = "terrabuild-terraform-state-production"
key            = "terraform.tfstate"
region         = "us-west-2"
dynamodb_table = "terrabuild-terraform-locks-production"
encrypt        = true