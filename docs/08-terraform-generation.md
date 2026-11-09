# Terraform Generation

## Pipeline

1. `toProject()` converts store state to the IR `Project`.
2. `generateTerraform(project)` produces a `GenResult` with files and warnings.
3. Toolbar zips files via JSZip and saves with file-saver.

## Provider blocks

Provider blocks are emitted based on `project.provider`:

- `aws`: AWS provider + region variable.
- `azure`: azurerm provider with features.
- `gcp`: Google provider with project/region variables.
- `multi`: all three providers and variables.

## Resource naming

Node labels are slugified to valid Terraform identifiers. Duplicate names within the same resource type receive a numeric suffix.

## Reference wiring

Connected parents populate arguments for supported AWS resources:

- `aws_subnet` → `vpc_id`
- `aws_route_table` → `vpc_id`
- `aws_internet_gateway` → `vpc_id`
- `aws_security_group` → `vpc_id`
- `aws_nat_gateway` → `subnet_id`
- `aws_instance` → `subnet_id`, `vpc_security_group_ids`
- `aws_lb` → `subnets`, `vpc_id`
- `aws_lb_target_group` → `vpc_id`

## Name handling

For AWS resources, the friendly `name` property is emitted as `tags = { Name = ... }`. For resources where `name` is a real Terraform argument, it is also retained.

## Outputs

Each resource with a `terraformType` gets an output named `<slug>_<terraform_type>_id`.

## Variables

Provider-specific variables are emitted in `variables.tf`.

## Warnings

Resources without a `terraformType` are skipped with a warning. Missing required parents produce validation errors before generation.

## Formatting

Generated HCL is valid but may not be canonically formatted. Run `terraform fmt` on the exported project.
