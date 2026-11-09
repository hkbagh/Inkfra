# Testing & Quality

## Static checks

```bash
npm run lint   # oxlint
npm run build  # tsc -b + vite build
```

## Terraform validation

Export a project and run:

```bash
terraform init -backend=false
terraform validate
terraform fmt -check
```

## Recommended test matrix

- Empty canvas export blocked by validation.
- Single VPC + subnet with contains edge validates.
- Multi-cloud project validates.
- Import of valid JSON succeeds.
- Import of invalid JSON is rejected.

## Performance

- Main bundle ~482KB (gzipped ~151KB).
- JSZip split into a separate chunk.
- Icon imports tree-shaken via explicit map.
