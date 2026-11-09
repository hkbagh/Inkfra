# API Reference

## Store (`src/store/useStore.ts`)

### State

- `nodes: Node<NodeData>[]`
- `edges: Edge[]`
- `selectedNodeId: string | null`
- `selectedEdgeId: string | null`
- `projectName: string`
- `projectDescription: string`
- `targetProvider: 'aws' | 'azure' | 'gcp' | 'multi'`

### Actions

- `addNode(def, position)`
- `updateNode(id, patch)`
- `updateNodeProperty(id, key, value)`
- `deleteNode(id)`
- `setSelectedNode(id)`
- `setSelectedEdge(id)`
- `onNodesChange(changes)`
- `onEdgesChange(changes)`
- `onConnect(conn)`
- `updateEdge(id, patch)`
- `deleteEdge(id)`
- `clear()`
- `loadProject(project)`
- `toProject()`

## Types (`src/types/ir.ts`)

- `Provider`, `Category`, `PropertyType`
- `PropertyDef`, `ResourceDef`
- `InfraNode`, `InfraEdge`, `Project`
- `EdgeKind`, `EDGE_KINDS`

## Library functions

### `src/lib/hcl.ts`

- `slugify(s: string): string`
- `hclValue(v: unknown): string`
- `hclBlock(type, name, props, extra?): string`

### `src/lib/terraform.ts`

- `generateTerraform(project: Project): GenResult`

### `src/lib/validate.ts`

- `validateProject(project: Project): ValidationIssue[]`

### `src/lib/project.ts`

- `parseProject(input: unknown): Project | null`

## Components

- `App`, `Toolbar`, `Sidebar`, `Canvas`, `PropertiesPanel`, `ResourceNode`, `ErrorBoundary`
