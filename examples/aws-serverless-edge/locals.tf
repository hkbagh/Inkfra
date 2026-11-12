locals {
  common_tags = {
    Project     = "AWS Serverless Edge API"
    Environment = var.environment
    ManagedBy   = "Inkfra"
  }
}
