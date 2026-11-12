locals {
  common_tags = {
    Project     = "EKS Production Platform"
    Environment = var.environment
    ManagedBy   = "Inkfra"
  }
}
