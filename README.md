# Inkfra — Visual-to-IaC Canvas

[![CI](https://github.com/harekrishnabagh/inkfra/actions/workflows/ci.yml/badge.svg)](https://github.com/harekrishnabagh/inkfra/actions/workflows/ci.yml)
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

## Documentation

See [`docs/README.md`](./docs/README.md).

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## License

MIT — see [`LICENSE`](./LICENSE).
