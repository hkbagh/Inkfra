locals {
  common_tags = {
    Project     = "Three-Tier Web App"
    Environment = var.environment
    ManagedBy   = "Inkfra"
  }
}
