# Next Steps Plan

This document defines the next implementation steps to move Inkfra from its current production-ready MVP to a best-in-class, industry-standard Infrastructure-as-Code generator.

## Guiding principles

- Generate valid, idiomatic, secure Terraform by default.
- Keep the diagram as the single source of truth.
- Prefer explicit schemas over generic property bags.
- Maintain automated quality gates for every change.

## Milestone 1 — Schema normalization (2-3 weeks)

### Objectives
- Replace generic properties with provider-accurate Terraform arguments.
- Add required/optional metadata and defaults.

### Tasks
1. Audit top 30 AWS resources against Terraform Registry docs.
2. Refactor `src/data/catalog.ts` property keys to real argument names.
3. Add `required` flags and validation messages.
4. Update generator to drop unknown/empty arguments.
5. Update `examples/` to reflect new schemas.

### Acceptance criteria
- All example projects pass `terraform validate`.
- No generic `name`/`description` properties remain for AWS resources unless they are real arguments.
- Validation reports missing required arguments.

## Milestone 2 — Security and compliance defaults (1-2 weeks)

### Objectives
- Ship secure-by-default infrastructure.

### Tasks
1. Add secure defaults: encryption, private subnets, restricted security groups.
2. Enforce tags (Owner, Environment, ManagedBy, CostCenter).
3. Add optional policy checks (tfsec/checkov) in CI.
4. Document security defaults in `docs/15-security.md`.

### Acceptance criteria
- Generated examples have no high-severity findings.
- Security defaults are documented and overridable.

## Milestone 3 — Testing and CI hardening (1-2 weeks)

### Objectives
- Prevent regressions in generated code.

### Tasks
1. Add golden-file tests for generated HCL.
2. Add snapshot tests per provider.
3. Add E2E tests for canvas → export.
4. Add tflint to CI for all examples.
5. Add `terraform fmt -check` to CI.

### Acceptance criteria
- CI fails on invalid or unformatted Terraform.
- Generator changes require updated golden files.

## Milestone 4 — UX and accessibility (2 weeks)

### Objectives
- Apply UI/UX best practices from design skills.

### Tasks
1. Improve sidebar search, filtering, and keyboard navigation.
2. Add undo/redo.
3. Add auto-layout and alignment guides.
4. Improve empty states and onboarding.
5. Add responsive layout and dark-mode polish.

### Acceptance criteria
- Lighthouse accessibility score >= 90.
- All interactive elements keyboard accessible.

## Milestone 5 — Advanced generation (3-4 weeks)

### Objectives
- Support real-world architectures.

### Tasks
1. Module generation (`module` blocks).
2. `for_each` for repeated resources.
3. Dynamic blocks for ingress/egress.
4. Multi-environment variable files.
5. Remote state backend templates.

### Acceptance criteria
- Generated code supports at least 3 real-world reference architectures.

## Milestone 6 — Community and ecosystem (ongoing)

### Objectives
- Grow the open-source community.

### Tasks
1. Add a plugin API for custom resources.
2. Add a public registry format for community catalogs.
3. Add issue triage and release cadence.
4. Publish documentation site.

### Acceptance criteria
- External contributors can add resources without core changes.
- Monthly releases with changelogs.

## Immediate next actions (this sprint)

1. Run a schema audit of the top 20 AWS resources.
2. Add golden-file tests for the AWS basic example.
3. Add tfsec to CI.
4. Implement undo/redo in the store.
5. Add a `docs/` search and navigation improvements.

## Metrics

- `terraform validate` pass rate: 100% on examples.
- Lint/test/build: green on every PR.
- Generated code review: 0 high-severity security findings.
- Community: 5+ external contributions per quarter.
