# Import & Export

## Export JSON

Click **Export** to download `<project>.inkfra.json`. The file contains the full IR: name, description, provider, nodes, edges, timestamps.

## Import JSON

Click **Import** and select a JSON file. The file is parsed and validated. Invalid files are rejected with an error message.

## Export Terraform

Click **Generate .tf** to download a ZIP containing:

- `main.tf`
- `variables.tf`
- `outputs.tf`
- `README.md`

## Round-tripping

Export JSON, edit externally if needed, then import to continue. Node IDs are preserved so connections remain intact.

## Validation on import

`parseProject` (in `src/lib/project.ts`) validates:

- Project is an object with a string `name`.
- `nodes` and `edges` are arrays.
- Nodes have required fields and numeric coordinates.
- Edges reference existing node IDs.
- Provider defaults to `aws` when absent.
