# Plan: Industry-Standard Terraform Generation

This plan upgrades Inkfra from generic property emission to production-grade, idiomatic Terraform.

## Phase 1 — Schema normalization (complete)
- Marked required arguments across AWS, Azure, GCP, and Terraform meta schemas; added Azure NIC/Service Plan/OS Disk and GCP Boot Disk/Settings/NIC blocks alongside AWS implicit networking glue (`aws_eip`, routes, attachments, DB subnet groups, EKS/Lambda IAM roles).
- Implemented validation rules for required arguments, CIDRs, port ranges, and multi-cloud parent checks (`validate.ts`).

## Phase 2 — Provider and module best practices (complete)
- Emit modular repo structure (`versions.tf`, `providers.tf`, `locals.tf`, `data.tf`, categorized `.tf` files, `environments/{dev,staging,prod}/terraform.tfvars`, `Makefile`, `.gitignore`) plus optional single-file mode.
- Emit full `tf_backend` attributes inside `versions.tf` and a standalone `bootstrap/backend.tf` state-bucket stack.
- Add `locals { common_tags }` merged into AWS resources plus documented variables and outputs.

## Phase 3 — Formatting and linting (complete)
- Canonical `=` alignment and nested block indentation in `hcl.ts` (`alignAttributes` + `hclBlock`) — verified clean with `terraform fmt -check`.
- `.tflint.hcl` and CI `terraform fmt -check` + `terraform validate` + `tflint` active across all `examples/`.

## Phase 4 — Security and compliance (complete)
- Zero plaintext secrets (`sensitive = true` DB password variables), IMDSv2 on EC2, S3 SSE encryption + public access block, private encrypted RDS defaults, and Trivy + OIDC CI/CD workflows (`devops.ts`).

## Phase 5 — Testing (in progress)
- Unit tests covering HCL formatting, Terraform single & modular generation, DevOps emitters, HCL import, store undo/redo/layout, and example blueprints.
- Remaining: Playwright E2E tests for canvas → export.

## Phase 6 — Advanced capabilities
- Module generation (`module "vpc" { source = "./modules/vpc" }`).
- `for_each` for repeated resources.
- Dynamic blocks for ingress/egress rules.
- Multi-environment workspaces and variable files.
- Acceptance: generated code scales to real-world architectures.

## Implementation priority
1. Phase 1 (schema) — highest impact on validity.
2. Phase 2 (provider/tags) — industry standard baseline.
3. Phase 3 (lint/CI) — quality gate.
4. Phase 4 (security) — compliance.
5. Phase 5 (tests) — regression safety.
6. Phase 6 (advanced) — differentiation.
