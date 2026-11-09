# Properties & Validation

## Properties

Properties are defined per resource in the catalog. Each property has a type, label, default, and optional options/placeholder/help.

Editing happens in the Properties panel and is stored on the node's `properties` map.

## Validation rules

Implemented in `src/lib/validate.ts`:

- Empty canvas warning.
- Unknown resource type (error).
- Empty label (warning).
- Missing required properties (error).
- Missing Terraform mapping (warning).
- Dangling connections (error).
- Self-loops (error).
- Duplicate labels within the same type (warning).
- Multiple cloud providers without multi target (info).
- Isolated resources (info).
- Required parent missing for AWS resources that need a container (error).

## Number inputs

Empty input is preserved as an empty string; invalid numbers are ignored. This prevents `NaN` from reaching generated HCL.

## JSON properties

`json`-typed properties are edited as text and emitted as strings. Treat them as raw HCL only if intentionally formatted as HCL.
