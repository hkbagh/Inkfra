# Roadmap

## Completed recently

- Undo/redo history (`Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y`), resource duplication (`Ctrl+D`), and tier-based auto-layout.
- Local `localStorage` autosave (`inkfra:autosave:v1`) across reloads.
- Bidirectional perimeter handles (`top`/`right`/`bottom`/`left`), whole-body drop targets, and Move (`V`) / Connect (`C`) canvas mode.
- Live `Preview .tf` modal with multi-file DevOps file tree (`Modular Repo` vs `Single main.tf`) and one-click copy.
- Implicit AWS/Azure/GCP cloud glue (`aws_eip`, route associations, LB attachments, DB subnet groups, Azure NIC/Service Plan, GCP boot/nic blocks).
- Runnable CI/CD (`.github/workflows/infra.yml`, `.gitlab-ci.yml`, `Jenkinsfile`), Docker Compose, Prometheus/Grafana, NGINX, Kustomize YAML, and Ansible emitters.
- Reverse `.tf` → canvas importer (`parseTerraformToProject`) via the toolbar **Import** action.
- Canonical `terraform fmt`-aligned HCL, documented `variables.tf` / `outputs.tf`, sensitive secrets hygiene, CIDR/port/security validation, and Vitest unit tests.

## Planned

- Native React Flow nested subflow container grouping.
- Playwright browser E2E test suite.
- Cost estimation hints.
- Live team collaboration and sharing.

## Contributions

Contributions are welcome. See [Developer Guide](./10-developer-guide.md).
