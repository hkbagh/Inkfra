output "main_vpc_aws_vpc_id" {
  description = "ID of Main VPC"
  value       = aws_vpc.main_vpc.id
}

output "public_subnet_a_aws_subnet_id" {
  description = "ID of Public Subnet A"
  value       = aws_subnet.public_subnet_a.id
}

output "public_subnet_b_aws_subnet_id" {
  description = "ID of Public Subnet B"
  value       = aws_subnet.public_subnet_b.id
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

output "application_lb_aws_lb_id" {
  description = "ID of Application LB"
  value       = aws_lb.application_lb.id
}

output "web_server_1_aws_instance_id" {
  description = "ID of Web Server 1"
  value       = aws_instance.web_server_1.id
}

output "web_server_2_aws_instance_id" {
  description = "ID of Web Server 2"
  value       = aws_instance.web_server_2.id
}

output "postgresql_db_aws_db_instance_id" {
  description = "ID of PostgreSQL DB"
  value       = aws_db_instance.postgresql_db.id
}

output "web_sg_aws_security_group_id" {
  description = "ID of Web SG"
  value       = aws_security_group.web_sg.id
}

output "db_sg_aws_security_group_id" {
  description = "ID of DB SG"
  value       = aws_security_group.db_sg.id
}

output "assets_bucket_aws_s3_bucket_id" {
  description = "ID of Assets Bucket"
  value       = aws_s3_bucket.assets_bucket.id
}
