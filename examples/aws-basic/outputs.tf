output "main_vpc_aws_vpc_id" {
  description = "ID of Main VPC"
  value       = aws_vpc.main_vpc.id
}

output "public_subnet_aws_subnet_id" {
  description = "ID of Public Subnet"
  value       = aws_subnet.public_subnet.id
}

output "internet_gateway_aws_internet_gateway_id" {
  description = "ID of Internet Gateway"
  value       = aws_internet_gateway.internet_gateway.id
}

output "web_security_group_aws_security_group_id" {
  description = "ID of Web Security Group"
  value       = aws_security_group.web_security_group.id
}

output "web_server_aws_instance_id" {
  description = "ID of Web Server"
  value       = aws_instance.web_server.id
}

output "assets_bucket_aws_s3_bucket_id" {
  description = "ID of Assets Bucket"
  value       = aws_s3_bucket.assets_bucket.id
}
