# Security

## Data handling

- All diagram data stays in the browser.
- No telemetry or backend calls are made.
- Exported files are generated client-side.

## Import safety

- Imported JSON is parsed and validated before use.
- Malformed input is rejected.

## Generated code

- Generated Terraform may contain user-provided values. Review before applying.
- Secrets should not be stored in node properties; use secret managers and variables.

## Dependencies

- Keep dependencies updated.
- Run `npm audit` periodically.

## Browser storage

- No data is persisted to localStorage by default. Projects are exported/imported explicitly.
