# User Guide

## 1. Create a project

- Set the project name and description in the toolbar.
- Choose a target provider: AWS, Azure, GCP, or Multi-cloud.

## 2. Add resources

- Use the sidebar to search or filter resources by provider/category.
- Drag a resource onto the canvas, or click it to add it at the next available position.

## 3. Connect resources

- Drag from a handle on one node to a handle on another to create a connection.
- Click a connection to change its kind (contains, depends on, connects, traffic, mounts, routes to).

## 4. Edit properties

- Click a node to open the properties panel.
- Edit the label and provider-specific properties.

## 5. Validate

- Click **Validate** to run diagram checks.
- Review errors/warnings in the validation panel.
- Clicking issues is informational; fix the underlying nodes.

## 6. Generate Terraform

- Click **Generate .tf** to download a ZIP containing `main.tf`, `variables.tf`, `outputs.tf`, and `README.md`.
- If validation errors exist, generation is blocked.

## 7. Import / Export

- **Export** saves the project as JSON.
- **Import** loads a previously exported JSON file.
- See [Import & Export](./09-import-export.md).

## Tips

- Use **contains** edges to express that a resource lives inside another (e.g., subnet in VPC).
- Use **depends_on** for ordering without a direct reference.
- Run `terraform fmt` on generated code for canonical formatting.
