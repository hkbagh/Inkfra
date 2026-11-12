# User Guide

## 1. Create a project

- Set the project name and description in the toolbar.
- Choose a target provider: AWS, Azure, GCP, or Multi-cloud.

## 2. Add resources

- Use the sidebar to search or filter resources by provider/category.
- Drag a resource onto the canvas, or click it to add it at the next available position.

## 3. Connect resources

- Hover any resource to reveal **top, right, bottom, and left** connection points (`ConnectionMode.Loose`) — connect from any side to any side (for example, top-to-top) or drop directly onto any target resource's body.
- Switch to **Connect mode (`C`)** in the top-left canvas toolbar (or press `C`) to drag wires directly from any resource body without hunting for edge dots; press `V` or `Esc` to return to **Move mode**.
- Drag any existing connector endpoint to reconnect it to another side or resource.
- Click a connection to change its kind (`contains`, `depends_on`, `connects`, `traffic`, `mounts`, `routes_to`) or swap its direction.

## 4. Organize, undo, and edit properties

- Use **Undo (`Ctrl+Z`)**, **Redo (`Ctrl+Shift+Z` / `Ctrl+Y`)**, **Duplicate (`Ctrl+D`)**, and **Layout** from the top-left canvas controls or keyboard shortcuts.
- Click a resource to open the properties panel; required fields are marked with `*`.
- Your canvas is automatically saved locally in browser storage (`inkfra:autosave:v1`) across reloads.

## 5. Validate

- Click **Validate** to run diagram, CIDR, port, required-field, and security checks.
- Click any issue in the validation banner to focus and center the offending resource on the canvas.

## 6. Preview & Generate Terraform

- Click **Preview .tf** to inspect live-generated `main.tf`, `variables.tf`, `outputs.tf`, and `README.md`, copy any file, or download the bundle.
- Click **Generate .tf** to download a ZIP containing `main.tf`, `variables.tf`, `outputs.tf`, and `README.md`.
- If validation errors exist, ZIP export is blocked (warnings remain informational).

## 7. Import / Export

- **Examples** loads curated blueprints (`aws-basic`, `three-tier-webapp`).
- **Export** saves the project as `.inkfra.json` (preserving connector anchor sides).
- **Import** loads a previously exported `.inkfra.json` file.
- See [Import & Export](./09-import-export.md).

## Tips

- Use **contains** or parent-child edges in either direction — Inkfra resolves the provider hierarchy automatically (e.g., subnet ↔ VPC, security group ↔ VPC, deployment ↔ namespace).
- Use **depends_on** for explicit ordering without a direct reference.
- Generated HCL is pre-formatted to canonical `terraform fmt` style.
