resource "aws_eks_cluster" "production_eks" {
  name       = "prod-eks"
  version    = "1.30"
  role_arn   = aws_iam_role.production_eks_eks_role.arn
  tags       = merge(local.common_tags, { Name = "prod-eks" })
  depends_on = [aws_subnet.private_subnet_a, aws_subnet.private_subnet_b]
  vpc_config {
    subnet_ids = [aws_subnet.private_subnet_a.id, aws_subnet.private_subnet_b.id]
  }
}


resource "aws_iam_role" "production_eks_eks_role" {
  name = "production_eks-eks-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "eks.amazonaws.com" }
    }]
  })
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "production_eks_eks_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.production_eks_eks_role.name
}
