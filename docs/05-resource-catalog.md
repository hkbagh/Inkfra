# Resource Catalog

Inkfra ships with a catalog of 100+ resources. Each resource has a type, provider, category, icon, and property schema.

## Providers

- `generic` — conceptual building blocks
- `aws` — Amazon Web Services
- `azure` — Microsoft Azure
- `gcp` — Google Cloud Platform
- `kubernetes` — Kubernetes resources
- `docker` — Docker resources
- `devops` — CI/CD, observability, messaging, databases
- `terraform` — Terraform meta resources

## Categories

network, compute, storage, database, security, observability, cicd, messaging, identity, platform, generic

## Resource definition

Each entry in `src/data/catalog.ts` follows `ResourceDef`:

```ts
interface ResourceDef {
  type: string
  label: string
  provider: Provider
  category: Category
  icon: string
  color: string
  terraformType?: string
  description?: string
  properties: PropertyDef[]
  container?: boolean
  size?: { w: number; h: number }
}
```

## Terraform mapping

Resources with a `terraformType` are emitted as Terraform resources. Resources without one are skipped with a warning. Generic resources are never emitted.

## Property types

`string`, `number`, `boolean`, `select`, `textarea`, `json`.
