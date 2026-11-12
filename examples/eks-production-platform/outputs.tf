output "platform_vpc_aws_vpc_id" {
  description = "ID of Platform VPC"
  value       = aws_vpc.platform_vpc.id
}

output "public_subnet_a_aws_subnet_id" {
  description = "ID of Public Subnet A"
  value       = aws_subnet.public_subnet_a.id
}

output "private_subnet_a_aws_subnet_id" {
  description = "ID of Private Subnet A"
  value       = aws_subnet.private_subnet_a.id
}

output "private_subnet_b_aws_subnet_id" {
  description = "ID of Private Subnet B"
  value       = aws_subnet.private_subnet_b.id
}

output "internet_gateway_aws_internet_gateway_id" {
  description = "ID of Internet Gateway"
  value       = aws_internet_gateway.internet_gateway.id
}

output "nat_gateway_aws_nat_gateway_id" {
  description = "ID of NAT Gateway"
  value       = aws_nat_gateway.nat_gateway.id
}

output "private_route_table_aws_route_table_id" {
  description = "ID of Private Route Table"
  value       = aws_route_table.private_route_table.id
}

output "production_eks_aws_eks_cluster_id" {
  description = "ID of Production EKS"
  value       = aws_eks_cluster.production_eks.id
}

output "app_postgres_rds_aws_db_instance_id" {
  description = "ID of App Postgres RDS"
  value       = aws_db_instance.app_postgres_rds.id
}
