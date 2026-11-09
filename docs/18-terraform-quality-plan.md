# Plan: Industry-Standard Terraform Generation

This plan upgrades Inkfra from generic property emission to production-grade, idiomatic Terraform.

## Phase 1 — Schema normalization
- Replace generic `name`/`description` properties with real Terraform argument names per resource.
- Add required/optional markers and defaults aligned with provider docs.
- Add validation rules for required arguments and value formats (CIDR, ports, regions).
- Acceptance: generated code passes `terraform validate` for all catalog resources with a connected parent.

## Phase 2 — Provider and module best practices
- Emit `terraform { required_version, required_providers }` with pinned versions.
- Add `locals { common_tags }` and merge into every resource.
- Add variables for region, environment, project, and tags.
- Add optional remote-state backend block (commented template).
- Acceptance: generated modules follow HashiCorp style guide.

## Phase 3 — Formatting and linting
- Run `terraform fmt` on export (via WASM or post-processing) or ship a fmt step in CI.
- Add `.tflint.hcl` and run tflint in CI on a generated example.
- Add `terraform validate` to CI for `examples/`.
- Acceptance: CI fails on invalid or unformatted Terraform.

## Phase 4 — Security and compliance
- Add secure defaults (encryption at rest, private subnets, no public SSH).
- Emit `tags` including Owner, Environment, ManagedBy.
- Add optional policy-as-code checks (tfsec/checkov) in CI.
- Acceptance: no high-severity findings on generated examples.

## Phase 5 — Testing
- Golden-file tests for generated HCL.
- Snapshot tests per provider.
- E2E tests for canvas → export.
- Acceptance: regression coverage for generator.

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
