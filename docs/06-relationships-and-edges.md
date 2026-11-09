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

## Semantics in generation

- `contains`, `depends_on`, `mounts`: add `depends_on` to the source resource.
- `connects`, `traffic`, `routes_to`: emitted as comments in `main.tf`.
- For supported AWS child resources, connected parents populate reference arguments (e.g., `vpc_id`, `subnet_id`, `subnets`, `vpc_security_group_ids`).

## Direction

Edges are directed from source to target. For containment, draw from the child to the parent (e.g., subnet → VPC).

## Constraints

- Self-loops are rejected at connect time.
- Duplicate edges between the same pair are rejected.
- Dangling edges (missing endpoints) are reported by validation.
