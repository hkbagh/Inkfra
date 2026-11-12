# Import & Export

## Export JSON

Click **Export** to download `<project>.inkfra.json`. The file contains the full IR: name, description, provider, nodes, edges (including optional `sourceHandle` / `targetHandle` anchor sides), and timestamps.

## Browser Autosave

Edits to the canvas and project metadata are automatically persisted locally under `localStorage` (`inkfra:autosave:v1`) with a short debounce and restored on reload.

## Import JSON or Terraform (`.tf`)

Click **Import** and select either:
- An `.inkfra.json` project file (`parseProject` preserves `exportLayout`, `sourceHandle`, and `targetHandle`), or
- One or more `.tf` HCL files (`parseTerraformToProject` parses `resource`, `module`, `variable`, and `terraform { backend }` blocks, infers resource edges, and auto-arranges the canvas).

## Preview & Export Terraform + DevOps

Click **Preview .tf** to switch between **Modular Repo** (`versions.tf`, `network.tf`, `compute.tf`, `environments/*/terraform.tfvars`, `Makefile`, `.github/workflows/infra.yml`, `docker-compose.yml`, etc.) and **Single `main.tf`**, inspect files, or download the `.zip` archive.

## Round-tripping

Export JSON, edit externally if needed, then import to continue. Node IDs are preserved so connections remain intact.

## Validation on import

`parseProject` (in `src/lib/project.ts`) validates:

- Project is an object with a string `name`.
- `nodes` and `edges` are arrays.
- Nodes have required fields and numeric coordinates.
- Edges reference existing node IDs.
- Provider defaults to `aws` when absent.
