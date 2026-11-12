resource "aws_sqs_queue" "async_jobs_fifo" {
  name       = "edge-jobs.fifo"
  fifo_queue = true
  tags       = merge(local.common_tags, { Name = "edge-jobs.fifo" })
}


resource "aws_sns_topic" "ops_alerts_topic" {
  name = "edge-ops-alerts"
  tags = merge(local.common_tags, { Name = "edge-ops-alerts" })
}

