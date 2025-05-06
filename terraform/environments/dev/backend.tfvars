bucket         = "terrabuild-terraform-state-dev"
key            = "terrabuild/dev/terraform.tfstate"
region         = "us-west-2"
encrypt        = true
dynamodb_table = "terrabuild-terraform-locks-dev"