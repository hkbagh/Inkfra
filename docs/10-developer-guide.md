# Developer Guide

## Project setup

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — Vite dev server.
- `npm run build` — Type-check and production build.
- `npm run lint` — oxlint.
- `npm run test` — Vitest suite.
- `npm run preview` — Preview production build.
- `npm run package:sea` — Build the desktop executable and bundle `dist/`.
- `npm run cf:dev` — Run the Cloudflare Worker locally.
- `npm run cf:deploy` — Build and deploy to Cloudflare Workers.
- `npm run changeset` — Add a changeset for the next release.
- `npm run verify:cloudflare` — Validate Cloudflare deploy credentials.

## Code style

- TypeScript strict mode.
- Functional React components.
- Zustand for state.
- Tailwind CSS for styling.

## Key modules

- `src/store/useStore.ts` — central state.
- `src/data/catalog.ts` — resource definitions.
- `src/lib/terraform.ts` — code generation.
- `src/lib/validate.ts` — validation.
- `src/lib/hcl.ts` — HCL helpers.
- `src/lib/project.ts` — import parsing.

## Adding a resource

See [Extending the Catalog](./12-extending-the-catalog.md).

## Adding a provider

1. Add provider to the `Provider` union in `src/types/ir.ts`.
2. Add resources to `src/data/catalog.ts`.
3. Add provider block and variables in `src/lib/terraform.ts`.
4. Update `varsFor` and `PROVIDER_BLOCKS`.

## Pull requests, builds, and releases

Follow [CONTRIBUTING.md](../CONTRIBUTING.md) for the branch, changeset, and pull request steps. The complete CI/CD reference is [CI/CD Operations](./25-ci-cd-operations.md), including:

- Manual CI, deploy, and desktop build commands.
- Alpha and stable release flows.
- Required repository secrets, including `RELEASE_TOKEN`.
- Workflow recovery and troubleshooting.

## Debugging

- Use browser devtools for React Flow issues.
- Run `terraform validate` on exported code.
- Check the validation panel in the UI.
