# Troubleshooting

## `terraform validate` fails on generated code

- Ensure required parents are connected (e.g., subnet → VPC).
- Run `terraform fmt` then re-validate.
- Check the validation panel before generating.

## Nodes land in the wrong place when dragging

- Ensure you are on the latest build.
- Pan/zoom should now be handled via `screenToFlowPosition`.

## Import fails

- Verify the JSON was exported by Inkfra.
- Check for truncated or modified files.

## Build errors

- Run `npm install` to ensure dependencies.
- Clear `node_modules` and reinstall if needed.

## Bundle too large

- The main bundle is ~482KB. JSZip is split out. Use a modern browser with caching.
