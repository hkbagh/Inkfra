# Security

## Data handling

- All diagram data stays in the browser.
- No telemetry or backend calls are made.
- Exported files are generated client-side.

## Import safety

- Imported JSON is parsed and validated before use.
- Malformed input is rejected.

## Generated code

- Generated Terraform may contain user-provided values. Review before applying.
- Secrets should not be stored in node properties; use secret managers and variables.

## Dependencies

- Keep dependencies updated.
- Run `npm audit` periodically.

## Secure-by-default generation & checks

- **Zero plaintext secrets**: Database passwords (`aws_rds_instance`, `azurerm_sql_server`) are stripped from generated resource HCL and replaced with `sensitive = true` variables.
- **Hardened compute & storage**: EC2 instances enforce IMDSv2 (`http_tokens = "required"`) and encrypted `root_block_device`; RDS enables `storage_encrypted = true` and `publicly_accessible = false`; S3 buckets emit `aws_s3_bucket_server_side_encryption_configuration`, `aws_s3_bucket_versioning`, and `aws_s3_bucket_public_access_block`.
- **Policy checks**: `validateProject()` warns on `public-read` S3 buckets, SSH (`22`) and sensitive DB/admin ports (`3389`, `5432`, `3306`, `6379`, `27017`) open to `0.0.0.0/0`, plain HTTP ALB listeners, and wildcard IAM policies (`Action: *`, `Resource: *`).
- **OIDC CI/CD workflows**: Generated `.github/workflows/infra.yml` and `.gitlab-ci.yml` default to OIDC token federation (`id-token: write`) and run `tflint` + `trivy config` scans before plan/apply.

## Browser storage

- Active canvas edits are automatically saved locally under `localStorage` (`inkfra:autosave:v1`) for session recovery. Projects never leave the browser unless exported explicitly.
