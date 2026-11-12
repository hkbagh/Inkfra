resource "aws_cognito_user_pool" "cognito_users" {
  name = "edge-api-users"
  tags = merge(local.common_tags, { Name = "edge-api-users" })
}

