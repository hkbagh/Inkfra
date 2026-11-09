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
   - `Toolbar`: project metadata, actions, validation results.
   - `Sidebar`: searchable, filterable resource library.
   - `Canvas`: React Flow canvas, drag-and-drop, selection.
   - `PropertiesPanel`: node/edge property editing.
   - `ResourceNode`: node rendering.
   - `ErrorBoundary`: crash isolation.

2. **State layer** (`src/store`)
   - Zustand store holds nodes, edges, selection, project metadata.
   - Exposes mutations and selectors.

3. **Domain layer** (`src/types`, `src/data`)
   - `ir.ts`: provider-agnostic intermediate representation.
   - `catalog.ts`: resource definitions and property schemas.

4. **Generation layer** (`src/lib`)
   - `hcl.ts`: HCL serialization helpers.
   - `terraform.ts`: provider-aware Terraform generation.
   - `validate.ts`: diagram validation.
   - `project.ts`: import parsing.

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
