variable "aws_region" {
  description = "AWS region for deployed resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment name (e.g. dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "app_postgres_rds_password" {
  description = "Master password for RDS instance app_postgres_rds"
  type        = string
  sensitive   = true
}
