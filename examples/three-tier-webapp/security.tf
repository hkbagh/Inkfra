resource "aws_security_group" "web_sg" {
  name        = "web-sg"
  description = "Allow HTTP/HTTPS"
  vpc_id      = aws_vpc.main_vpc.id
  tags        = merge(local.common_tags, { Name = "web-sg" })
  depends_on  = [aws_vpc.main_vpc]
}


resource "aws_security_group" "db_sg" {
  name        = "db-sg"
  description = "Allow Postgres from web"
  vpc_id      = aws_vpc.main_vpc.id
  tags        = merge(local.common_tags, { Name = "db-sg" })
  depends_on  = [aws_vpc.main_vpc]
}

