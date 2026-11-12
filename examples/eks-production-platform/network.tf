resource "aws_vpc" "platform_vpc" {
  cidr_block           = "10.20.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags                 = merge(local.common_tags, { Name = "eks-platform-vpc" })
}


resource "aws_subnet" "public_subnet_a" {
  cidr_block              = "10.20.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true
  vpc_id                  = aws_vpc.platform_vpc.id
  tags                    = merge(local.common_tags, { Name = "eks-public-a" })
  depends_on              = [aws_vpc.platform_vpc]
}


resource "aws_subnet" "private_subnet_a" {
  cidr_block              = "10.20.11.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = false
  vpc_id                  = aws_vpc.platform_vpc.id
  tags                    = merge(local.common_tags, { Name = "eks-private-a" })
  depends_on              = [aws_vpc.platform_vpc]
}


resource "aws_subnet" "private_subnet_b" {
  cidr_block              = "10.20.12.0/24"
  availability_zone       = "us-east-1b"
  map_public_ip_on_launch = false
  vpc_id                  = aws_vpc.platform_vpc.id
  tags                    = merge(local.common_tags, { Name = "eks-private-b" })
  depends_on              = [aws_vpc.platform_vpc]
}


resource "aws_internet_gateway" "internet_gateway" {
  vpc_id     = aws_vpc.platform_vpc.id
  tags       = merge(local.common_tags, { Name = "eks-igw" })
  depends_on = [aws_vpc.platform_vpc]
}


resource "aws_nat_gateway" "nat_gateway" {
  connectivity_type = "public"
  subnet_id         = aws_subnet.public_subnet_a.id
  allocation_id     = aws_eip.nat_gateway_eip.id
  tags              = merge(local.common_tags, { Name = "eks-nat" })
  depends_on        = [aws_subnet.public_subnet_a]
}


resource "aws_eip" "nat_gateway_eip" {
  domain = "vpc"
  tags   = merge(local.common_tags, { Name = "nat_gateway-eip" })
}

resource "aws_route_table" "private_route_table" {
  vpc_id     = aws_vpc.platform_vpc.id
  tags       = merge(local.common_tags, { Name = "eks-private-rt" })
  depends_on = [aws_vpc.platform_vpc]
}


resource "aws_route_table_association" "private_subnet_a_private_route_table" {
  subnet_id      = aws_subnet.private_subnet_a.id
  route_table_id = aws_route_table.private_route_table.id
}

resource "aws_route" "private_route_table_nat" {
  route_table_id         = aws_route_table.private_route_table.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat_gateway.id
}
