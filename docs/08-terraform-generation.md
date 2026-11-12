# Terraform Generation

## Pipeline & Export Layouts

1. `toProject()` converts store state to the IR `Project` (including `exportLayout`: `'modular'` or `'single'`).
2. `generateTerraform(project)` produces a `GenResult` (`files`, `warnings`) combining Terraform HCL and DevOps artifacts for **Preview .tf** and ZIP export.
3. **Modular Repo (default)**: emits `versions.tf`, `providers.tf`, `locals.tf`, optional `data.tf`, category files (`network.tf`, `compute.tf`, `database.tf`, `security.tf`, `storage.tf`, `platform.tf`), `variables.tf`, `outputs.tf`, `terraform.tfvars.example`, `environments/{dev,staging,prod}/terraform.tfvars`, `Makefile`, `.tflint.hcl`, `.gitignore`, optional `bootstrap/backend.tf`, plus any DevOps files.
4. **Single `main.tf` mode**: combines Terraform blocks into `main.tf`, `variables.tf`, `outputs.tf`, and `README.md` alongside DevOps files.

## Provider, Data & Backend blocks

Provider blocks (`required_version`, `required_providers`, and `provider`) are emitted from `project.provider` **and** detected resource providers across AWS, Azure (`azurerm`), GCP (`google`), Kubernetes, Docker, and Helm. If `tf_backend` is present, full backend configuration (`bucket`, `key`, `region`, `encrypt`, `use_lockfile`) is emitted inside `terraform { backend }` plus an optional `bootstrap/backend.tf` state-bucket stack. Dynamic `data "aws_ami" "amazon_linux"` lookup is emitted automatically when EC2 `ami` is `"auto"` or empty. AWS projects include `locals { common_tags = ... }`.

## Implicit Cloud Glue & Reference Wiring

Connected parents/peers populate arguments bidirectionally and emit required companion glue resources:

- **AWS**: `aws_nat_gateway` (public) auto-emits `aws_eip`; `aws_route_table` auto-emits `aws_route_table_association` + default `0.0.0.0/0` `aws_route` entries; `aws_lb_target_group` connected to EC2 auto-emits `aws_lb_target_group_attachment`; `aws_db_instance` emits `aws_db_subnet_group`, `storage_encrypted = true`, `publicly_accessible = false`, and `sensitive = true` password variables; `aws_eks_cluster` and `aws_lambda_function` auto-emit required IAM roles and policies; `aws_cloudfront_distribution` emits `origin`, cache behavior, and restrictions blocks.
- **Azure**: `azurerm_linux_virtual_machine` auto-emits `azurerm_network_interface`, `os_disk`, `source_image_reference`, and a sensitive `admin_password` variable; `azurerm_linux_web_app` auto-emits `azurerm_service_plan`; `azurerm_mssql_server` uses a sensitive SQL password variable.
- **GCP**: `google_compute_instance` emits `boot_disk` and `network_interface`; `google_sql_database_instance` emits `settings { tier }`; `google_compute_subnetwork` & `google_compute_firewall` wire `network`.
- **DevOps Artifacts (`src/lib/devops.ts`)**: `devops_github_actions` → `.github/workflows/infra.yml` (OIDC default); `devops_gitlab_ci` → `.gitlab-ci.yml`; `devops_jenkins` → `Jenkinsfile`; `devops_argocd_app` → `gitops/argocd/<name>.yaml`; `devops_ansible_playbook` → `ansible/site.yml` + `inventory.ini`; `k8s_*`/`sec_cert_manager` → `k8s/` + `kustomization.yaml`; `docker_*`/`db_*`/`msg_*`/`net_nginx`/`obs_prometheus`/`obs_grafana` → `docker-compose.yml`, `monitoring/prometheus.yml`, Grafana datasource provisioning, and `nginx/nginx.conf`.

## Structured blocks & modern AWS resources

- `aws_security_group` parses newline, comma, or semicolon rules into typed `ingress` / `egress` blocks.
- `aws_instance` emits `root_block_device { volume_size = ... }`.
- `aws_s3_bucket` emits modern AWS provider v5 companion resources (`aws_s3_bucket_versioning` and `aws_s3_bucket_public_access_block`) instead of deprecated inline attributes.
- `azurerm_subnet`, `azurerm_virtual_network`, `azurerm_kubernetes_cluster`, `google_compute_firewall`, `docker_container`, `docker_image`, `kubernetes_deployment`, `kubernetes_service`, and `tf_module_call` emit idiomatic nested HCL blocks.

## Name handling

For AWS resources, the friendly `name` property is merged into `tags = merge(local.common_tags, { Name = ... })`. For resources where `name` is a real Terraform argument, it is also retained.

## Outputs & Variables

- Each resource with a `terraformType` gets a documented output (`description`, `value`) in `outputs.tf` (plus `.endpoint`, `.arn`, `.dns_name` where appropriate), alongside any custom `tf_output` nodes.
- All variables in `variables.tf` (provider defaults, `environment`, and custom `tf_variable` nodes) include `description` and `type` metadata.

## Warnings

Unmapped non-generic resources (and cross-provider mismatches when `targetProvider !== 'multi'`) produce clear warnings. Missing required parents, invalid CIDRs, or invalid ports produce validation errors before ZIP export.

## Formatting

`hcl.ts` (`alignAttributes` + indented `hclBlock`) aligns `=` columns and nested blocks so generated `.tf` files pass `terraform fmt -check` out of the box.
