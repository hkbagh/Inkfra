resource "aws_s3_bucket" "assets_bucket" {
  bucket = "app-assets-bucket"
  tags   = local.common_tags
}


resource "aws_s3_bucket_versioning" "assets_bucket_versioning" {
  bucket = aws_s3_bucket.assets_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets_bucket_sse" {
  bucket = aws_s3_bucket.assets_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "assets_bucket_public_access" {
  bucket = aws_s3_bucket.assets_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
