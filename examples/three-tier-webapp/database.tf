resource "aws_db_instance" "postgresql_db" {
  engine                 = "postgres"
  instance_class         = "db.t3.small"
  allocated_storage      = 20
  username               = "appuser"
  password               = var.postgresql_db_password
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  db_name                = "appdb"
  storage_encrypted      = true
  publicly_accessible    = false
  db_subnet_group_name   = aws_db_subnet_group.postgresql_db_subnets.name
  tags                   = local.common_tags
  depends_on             = [aws_subnet.private_subnet_a]
}


resource "aws_db_subnet_group" "postgresql_db_subnets" {
  name       = "postgresql_db-subnets"
  subnet_ids = [aws_subnet.private_subnet_a.id]
  tags       = local.common_tags
}
