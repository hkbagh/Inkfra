resource "aws_cloudfront_distribution" "cloudfront_edge_cdn" {
  comment = "Edge CDN for static assets and API"
  enabled = true
  tags    = local.common_tags
  origin {
    domain_name = aws_s3_bucket.static_web_origin.bucket_regional_domain_name
    origin_id   = "cloudfront_edge_cdn-origin"
  }
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "cloudfront_edge_cdn-origin"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  viewer_certificate {
    cloudfront_default_certificate = true
  }
}


resource "aws_api_gateway_rest_api" "edge_rest_api" {
  name = "edge-public-api"
  tags = merge(local.common_tags, { Name = "edge-public-api" })
}

