# Architecture

## High-level

Inkfra is a client-side single-page application. All state lives in the browser; no backend is required for generation or validation.

```mermaid
flowchart LR
  A[Resource Library] -->|drag/click| B[Canvas (React Flow)]
  B --> C[Zustand Store]
  C --> D[Properties Panel]
  C --> E[Validator]
  C --> F[Terraform Generator]
  F --> G[ZIP / JSON Export]
```

## Layers

1. **Presentation layer** (`src/components`)
   - `Toolbar`: project metadata, provider logo selector, examples modal trigger, validation, live code preview trigger, ZIP/JSON import-export.
   - `Sidebar`: searchable, filterable resource library with provider vector logos and responsive mobile/tablet drawer.
   - `Canvas`: React Flow canvas with Move (`V`) / Connect (`C`) modes, bidirectional perimeter & whole-body connectors, Undo/Redo, Duplicate, and tier-based Auto Layout.
   - `PropertiesPanel`: node/edge property editing, edge handle swap/reconnect, duplication, required-field hints, and responsive mobile drawer.
   - `ResourceNode`: animated resource cards with provider/brand SVGs and top/right/bottom/left loose handles.
   - `InfraEdge` & `CustomConnectionLine`: smooth bezier connectors with hover controls, inline kind pills, and directional animated flow.
   - `ExamplesModal` & `CodePreviewModal`: built-in blueprint loader and multi-file `.tf` / `README.md` live viewer with copy and ZIP export.
   - `BrandLogos`: custom SVG marks for Inkfra and cloud/platform providers (`src/lib/brandMeta.ts` for curated resource icons).
   - `ErrorBoundary`: crash isolation.

2. **State layer** (`src/store`)
   - Zustand store holds nodes, edges, selection, project metadata, Move/Connect tool mode, Undo/Redo history stacks, and debounced `localStorage` autosave (`inkfra:autosave:v1`).
   - Exposes mutations, auto-layout, duplication, handle-preserving connect/reconnect, and selectors.

3. **Domain layer** (`src/types`, `src/data`)
   - `ir.ts`: provider-agnostic intermediate representation.
   - `catalog.ts`: resource definitions and property schemas.

4. **Generation & Import layer** (`src/lib`)
   - `hcl.ts`: HCL serialization and `=` alignment helpers.
   - `terraform.ts`: multi-cloud IaC generator (modular repo split & single-file modes, implicit AWS/Azure/GCP glue, dynamic data lookups, bootstrap stacks).
   - `devops.ts`: CI/CD workflow (`.github/workflows/infra.yml`, `.gitlab-ci.yml`, `Jenkinsfile`), Docker Compose, NGINX, Prometheus/Grafana, ArgoCD/K8s YAML, and Ansible emitters.
   - `tfImport.ts`: Terraform HCL parser importing `.tf` files back into IR nodes & edges.
   - `validate.ts`: diagram, CIDR, port, parent-hierarchy, and security posture validation.
   - `project.ts`: JSON IR import parsing.

## Data flow

1. User adds resources from the library to the canvas.
2. Store updates nodes/edges.
3. Properties panel edits node properties in the store.
4. Validation reads the current project from the store.
5. Generator reads the project and emits files.
6. Export writes files via JSZip/file-saver.

## Key directories

```
src/
  components/   UI components
  data/         Resource catalog
  lib/          HCL, Terraform, validation, project parsing
  store/        Zustand state
  types/        IR types
```
