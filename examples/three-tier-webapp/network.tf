resource "aws_vpc" "main_vpc" {
  cidr_block = "10.0.0.0/16"
  tags       = merge(local.common_tags, { Name = "main-vpc" })
}


resource "aws_subnet" "public_subnet_a" {
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true
  vpc_id                  = aws_vpc.main_vpc.id
  tags                    = merge(local.common_tags, { Name = "public-a" })
  depends_on              = [aws_vpc.main_vpc]
}


resource "aws_subnet" "public_subnet_b" {
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "us-east-1b"
  map_public_ip_on_launch = true
  vpc_id                  = aws_vpc.main_vpc.id
  tags                    = merge(local.common_tags, { Name = "public-b" })
  depends_on              = [aws_vpc.main_vpc]
}


resource "aws_subnet" "private_subnet_a" {
  cidr_block        = "10.0.11.0/24"
  availability_zone = "us-east-1a"
  vpc_id            = aws_vpc.main_vpc.id
  tags              = merge(local.common_tags, { Name = "private-a" })
  depends_on        = [aws_vpc.main_vpc]
}


resource "aws_subnet" "private_subnet_b" {
  cidr_block        = "10.0.12.0/24"
  availability_zone = "us-east-1b"
  vpc_id            = aws_vpc.main_vpc.id
  tags              = merge(local.common_tags, { Name = "private-b" })
  depends_on        = [aws_vpc.main_vpc]
}


resource "aws_internet_gateway" "internet_gateway" {
  vpc_id     = aws_vpc.main_vpc.id
  tags       = merge(local.common_tags, { Name = "igw" })
  depends_on = [aws_vpc.main_vpc]
}


resource "aws_lb" "application_lb" {
  load_balancer_type = "application"
  internal           = false
  name               = "alb"
  subnets            = [aws_subnet.public_subnet_a.id, aws_subnet.public_subnet_b.id]
  tags               = merge(local.common_tags, { Name = "alb" })
}

