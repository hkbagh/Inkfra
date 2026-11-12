resource "aws_lambda_function" "api_handler_lambda" {
  function_name = "edge-api-handler"
  runtime       = "nodejs20.x"
  handler       = "index.handler"
  memory_size   = 256
  timeout       = 15
  role          = aws_iam_role.api_handler_lambda_lambda_role.arn
  filename      = "lambda.zip"
  tags          = local.common_tags
}


resource "aws_iam_role" "api_handler_lambda_lambda_role" {
  name = "api_handler_lambda-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "api_handler_lambda_lambda_logs" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.api_handler_lambda_lambda_role.name
}
