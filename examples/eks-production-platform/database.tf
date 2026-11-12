resource "aws_db_instance" "app_postgres_rds" {
  engine               = "postgres"
  engine_version       = "15"
  instance_class       = "db.t3.small"
  allocated_storage    = 50
  username             = "appadmin"
  skip_final_snapshot  = true
  db_name              = "platformdb"
  password             = var.app_postgres_rds_password
  storage_encrypted    = true
  publicly_accessible  = false
  db_subnet_group_name = aws_db_subnet_group.app_postgres_rds_subnets.name
  tags                 = local.common_tags
  depends_on           = [aws_subnet.private_subnet_a, aws_subnet.private_subnet_b]
}


resource "aws_db_subnet_group" "app_postgres_rds_subnets" {
  name       = "app_postgres_rds-subnets"
  subnet_ids = [aws_subnet.private_subnet_a.id, aws_subnet.private_subnet_b.id]
  tags       = local.common_tags
}
