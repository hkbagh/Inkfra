resource "aws_dynamodb_table" "sessions_dynamodb" {
  name         = "edge-sessions"
  hash_key     = "session_id"
  billing_mode = "PAY_PER_REQUEST"
  tags         = merge(local.common_tags, { Name = "edge-sessions" })
  attribute {
    name = "session_id"
    type = "S"
  }
}

