# Inkfra — Visual-to-IaC Canvas

[![CI](https://github.com/hkbagh/Inkfra/actions/workflows/ci.yml/badge.svg)](https://github.com/hkbagh/Inkfra/actions/workflows/ci.yml)
[![Deploy](https://github.com/hkbagh/Inkfra/actions/workflows/deploy-cloudflare.yml/badge.svg)](https://github.com/hkbagh/Inkfra/actions/workflows/deploy-cloudflare.yml)
[![Release](https://github.com/hkbagh/Inkfra/actions/workflows/release.yml/badge.svg)](https://github.com/hkbagh/Inkfra/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Inkfra is an open-source, browser-based visual canvas that converts architecture diagrams into ready-to-use Terraform infrastructure code.

## Features

- Drag-and-drop library of 100+ cloud and DevOps resources (AWS, Azure, GCP, Kubernetes, Docker, CI/CD, observability, databases, messaging, Terraform meta).
- Typed relationships: contains, depends on, connects, traffic, mounts, routes to.
- Property editor with validation before generation.
- Terraform code generation with reference wiring (`vpc_id`, `subnet_id`, `subnets`, security groups).
- Export as Terraform ZIP or project JSON; import round-trip.
- Fully client-side; no backend required.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Live demo

https://inkfra.bagh.co.in

## CI/CD and releases

| Workflow                 | Trigger                    | Purpose                                             |
| ------------------------ | -------------------------- | --------------------------------------------------- |
| CI                       | Pull request, push, manual | Lint, build, tests, Terraform validation            |
| Deploy                   | Push to `main`, manual     | Deploy the site to Cloudflare Workers and verify it |
| Release                  | Push to `main`             | Open the version PR or create the next release tag  |
| Release Desktop          | `v*` tag, manual           | Publish Windows and Linux desktop bundles           |
| Desktop Build (Node SEA) | Manual                     | Build desktop bundles for verification              |

Manual workflow examples:

```bash
gh workflow run ci.yml --ref main
gh workflow run deploy-cloudflare.yml --ref main
gh workflow run desktop.yml --ref main
gh workflow run release-desktop.yml -f tag=v0.2.0-alpha.N
```

Desktop releases contain `inkfra-windows.zip` and `inkfra-linux.zip`, each with the executable and its `dist/` assets. See [Releases](https://github.com/hkbagh/Inkfra/releases).

See [CI/CD Operations](./docs/25-ci-cd-operations.md) for secrets, pull request steps, alpha and stable releases, and troubleshooting.

## Documentation

See [`docs/README.md`](./docs/README.md).

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## License

MIT — see [`LICENSE`](./LICENSE).
