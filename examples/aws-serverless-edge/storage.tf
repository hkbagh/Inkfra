resource "aws_s3_bucket" "static_web_origin" {
  bucket = "inkfra-edge-assets-prod"
  tags   = local.common_tags
}


resource "aws_s3_bucket_versioning" "static_web_origin_versioning" {
  bucket = aws_s3_bucket.static_web_origin.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "static_web_origin_sse" {
  bucket = aws_s3_bucket.static_web_origin.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "static_web_origin_public_access" {
  bucket = aws_s3_bucket.static_web_origin.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
