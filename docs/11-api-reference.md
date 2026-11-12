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
- `exportLayout: 'modular' | 'single'`
- `connectMode: boolean`
- `canUndo: boolean`, `canRedo: boolean`
- `fitViewSignal: number`, `focusNodeId: string | null`, `focusSignal: number`

### Actions

- `addNode(def, position)`
- `updateNode(id, patch)`
- `updateNodeProperty(id, key, value)`
- `deleteNode(id)`
- `duplicateSelected()`
- `autoLayout()`
- `setSelectedNode(id)`
- `setSelectedEdge(id)`
- `focusNode(id)`
- `setConnectMode(enabled)`, `toggleConnectMode()`
- `undo()`, `redo()`, `recordHistorySnapshot()`
- `onNodesChange(changes)`
- `onEdgesChange(changes)`
- `onConnect(conn)`
- `onReconnect(oldEdge, newConn)`
- `updateEdge(id, patch)`
- `deleteEdge(id)`
- `clear()`
- `loadProject(project)`
- `importTerraform(files, name?)`
- `setExportLayout(layout)`
- `toProject()`

## Types (`src/types/ir.ts`)

- `Provider`, `Category`, `PropertyType`
- `PropertyDef`, `ResourceDef`
- `InfraNode`, `InfraEdge` (includes `sourceHandle?: string`, `targetHandle?: string`), `Project`
- `EdgeKind`, `EDGE_KINDS`

## Library functions

### `src/lib/hcl.ts`

- `slugify(s: string): string`
- `hclValue(v: unknown, indent?: number): string`
- `alignAttributes(entries, indent?): string[]`
- `hclBlock(type, name, props, extra?): string`

### `src/lib/terraform.ts`

- `generateTerraform(project: Project): GenResult`

### `src/lib/devops.ts`

- `DEVOPS_ARTIFACT_TYPES: Set<string>`
- `generateDevOpsFiles(project: Project): Record<string, string>`

### `src/lib/tfImport.ts`

- `parseTerraformToProject(files, projectName?): Project`

### `src/lib/validate.ts`

- `validateProject(project: Project): ValidationIssue[]`

### `src/lib/project.ts`

- `parseProject(input: unknown): Project | null`

### `src/lib/brandMeta.ts`

- `BRANDED_RESOURCE_TYPES: Set<string>`

## Components

- `App`, `Toolbar`, `Sidebar`, `Canvas`, `PropertiesPanel`, `ResourceNode`, `InfraEdge`, `CustomConnectionLine`, `ExamplesModal`, `CodePreviewModal`, `BrandLogos`, `ErrorBoundary`
