resource "aws_instance" "web_server_1" {
  instance_type          = "t3.small"
  ami                    = "ami-0c55b159cbfafe1f0"
  subnet_id              = aws_subnet.private_subnet_a.id
  vpc_security_group_ids = [aws_security_group.web_sg.id]
  tags                   = merge(local.common_tags, { Name = "web-1" })
  depends_on             = [aws_subnet.private_subnet_a]
  root_block_device {
    volume_size = 20
    encrypted   = true
  }
  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }
}


resource "aws_instance" "web_server_2" {
  instance_type          = "t3.small"
  ami                    = "ami-0c55b159cbfafe1f0"
  subnet_id              = aws_subnet.private_subnet_b.id
  vpc_security_group_ids = [aws_security_group.web_sg.id]
  tags                   = merge(local.common_tags, { Name = "web-2" })
  depends_on             = [aws_subnet.private_subnet_b]
  root_block_device {
    volume_size = 20
    encrypted   = true
  }
  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }
}

