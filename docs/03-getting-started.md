# Getting Started

## Prerequisites

- Node.js 20+ (tested with Node 24)
- npm 10+
- Optional: Terraform CLI for validating generated code

## Install

```bash
git clone <repository-url>
cd "Project Inkfra"
npm install
```

## Run in development

```bash
npm run dev
```

Open http://localhost:5173.

## Build for production

```bash
npm run build
```

Output is in `dist/`.

## Preview production build

```bash
npm run preview
```

## Lint

```bash
npm run lint
```

## Validate generated Terraform (optional)

```bash
cd <exported-project>
terraform init -backend=false
terraform validate
terraform fmt
```
