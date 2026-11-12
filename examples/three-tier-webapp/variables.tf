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

variable "postgresql_db_password" {
  description = "Master password for RDS instance postgresql_db"
  type        = string
  sensitive   = true
}
