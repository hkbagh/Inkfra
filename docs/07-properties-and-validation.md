# Properties & Validation

## Properties

Properties are defined per resource in the catalog. Each property has a type, label, default, and optional options/placeholder/help.

Editing happens in the Properties panel and is stored on the node's `properties` map.

## Validation rules

Implemented in `src/lib/validate.ts`:

- Empty canvas warning.
- Unknown resource type (error).
- Empty label (warning).
- Missing required properties (error), highlighted with `*` in the Properties panel.
- Invalid CIDR blocks on `cidr_block`, `address_space`, and `ip_cidr_range` (error).
- Invalid port numbers outside `1..65535` on `port`, `target_port`, `ports_internal`, and `ports_external` (error).
- Missing Terraform mapping (warning; Terraform meta nodes such as `tf_variable`, `tf_output`, `tf_backend`, and `tf_module_call` are supported directly).
- Dangling connections (error).
- Self-loops (error).
- Duplicate labels within the same type (warning).
- Multiple cloud providers without `multi` target (info).
- Isolated resources (info).
- Required parent missing for AWS, Azure, and GCP networking resources (`aws_subnet`, `aws_nat_gateway`, `azurerm_subnet`, `google_compute_subnetwork`, etc.), evaluated bidirectionally regardless of edge direction (error).
- Security posture warnings: `aws_s3_bucket` with `public-read` ACL, `aws_security_group` exposing SSH (`22`) or sensitive DB/admin ports (`3389`, `5432`, `3306`, `6379`, `27017`) to `0.0.0.0/0`, plain HTTP `aws_lb_listener`, wildcard IAM policies (`Action: *` / `Resource: *`), and plaintext DB password removal notice (warning).
- High-availability warning: `aws_lb` connected to fewer than 2 subnets (warning).

Clicking any issue with an associated resource focuses and centers that node on the canvas.

## Number inputs

Empty input is preserved as an empty string; invalid numbers are ignored. This prevents `NaN` from reaching generated HCL.

## JSON properties

`json`-typed properties are edited as text and emitted as strings. Treat them as raw HCL only if intentionally formatted as HCL.
