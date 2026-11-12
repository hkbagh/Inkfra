output "cloudfront_edge_cdn_aws_cloudfront_distribution_id" {
  description = "ID of CloudFront Edge CDN"
  value       = aws_cloudfront_distribution.cloudfront_edge_cdn.id
}

output "static_web_origin_aws_s3_bucket_id" {
  description = "ID of Static Web Origin"
  value       = aws_s3_bucket.static_web_origin.id
}

output "edge_rest_api_aws_api_gateway_rest_api_id" {
  description = "ID of Edge REST API"
  value       = aws_api_gateway_rest_api.edge_rest_api.id
}

output "cognito_users_aws_cognito_user_pool_id" {
  description = "ID of Cognito Users"
  value       = aws_cognito_user_pool.cognito_users.id
}

output "api_handler_lambda_aws_lambda_function_id" {
  description = "ID of API Handler Lambda"
  value       = aws_lambda_function.api_handler_lambda.id
}

output "sessions_dynamodb_aws_dynamodb_table_id" {
  description = "ID of Sessions DynamoDB"
  value       = aws_dynamodb_table.sessions_dynamodb.id
}

output "async_jobs_fifo_aws_sqs_queue_id" {
  description = "ID of Async Jobs FIFO"
  value       = aws_sqs_queue.async_jobs_fifo.id
}

output "ops_alerts_topic_aws_sns_topic_id" {
  description = "ID of Ops Alerts Topic"
  value       = aws_sns_topic.ops_alerts_topic.id
}
