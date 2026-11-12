# Relationships & Edges

## Edge kinds

| Kind | Meaning | Visual |
| --- | --- | --- |
| contains | One resource is contained in another | solid |
| depends_on | Explicit dependency / ordering | dashed |
| connects | General connection | solid |
| traffic | Network traffic flow | animated |
| mounts | Storage mount | dotted |
| routes_to | Routing target | solid |

## Connectors & Direction

- **Any-point perimeter handles**: Every node exposes bidirectional `top`, `right`, `bottom`, and `left` handles in `ConnectionMode.Loose`, allowing exact side-to-side routing (e.g., top-to-top) plus endpoint reconnection.
- **Whole-body drop & Connect mode (`C`)**: Dropping a wire onto any part of a target resource snaps cleanly to its closest perimeter side, and toggling **Connect** mode lets users drag wires directly between resource bodies.
- Edges store `sourceHandle` and `targetHandle` in the project IR (`v1` JSON). Users can also swap an edge's direction from the Properties Panel.
- **Bidirectional reference resolution**: During validation and Terraform generation, Inkfra resolves supported parent-child and peer references regardless of which direction the edge was drawn (child → parent or parent → child), across AWS, Azure, GCP, Docker, and Kubernetes.

## Semantics in generation

- `contains`, `depends_on`, `mounts`: add explicit `depends_on` ordering from child to parent where applicable.
- `connects`, `traffic`, `routes_to`: emitted as relationship comments in `main.tf` alongside inferred reference wiring.
- Connected peers populate Terraform reference arguments automatically (e.g., `vpc_id`, `subnet_id`, `subnets`, `vpc_security_group_ids`, `load_balancer_arn`, `target_group_arn`, `resource_group_name`, `virtual_network_name`, `network`, `image`, and `namespace`).

## Constraints

- Self-loops are rejected at connect time.
- Duplicate edges between the same pair are rejected.
- Dangling edges (missing endpoints) are reported by validation.
