import { create } from 'zustand'
import type { Node, Edge, NodeChange, EdgeChange, Connection } from '@xyflow/react'
import type { InfraNode, InfraEdge, Project, ResourceDef } from '../types/ir'

export interface NodeData {
  resourceType: string
  label: string
  provider: string
  properties: Record<string, any>
  [key: string]: unknown
}

interface Store {
  nodes: Node<NodeData>[]
  edges: Edge[]
  selectedNodeId: string | null
  selectedEdgeId: string | null
  projectName: string
  projectDescription: string
  targetProvider: 'aws' | 'azure' | 'gcp' | 'multi'

  setProjectName: (n: string) => void
  setProjectDescription: (d: string) => void
  setTargetProvider: (p: Store['targetProvider']) => void

  addNode: (def: ResourceDef, position: { x: number; y: number }) => void
  updateNode: (id: string, patch: Partial<NodeData>) => void
  updateNodeProperty: (id: string, key: string, value: any) => void
  deleteNode: (id: string) => void
  setSelectedNode: (id: string | null) => void
  setSelectedEdge: (id: string | null) => void

  onNodesChange: (changes: NodeChange<Node<NodeData>>[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (conn: Connection) => void
  updateEdge: (id: string, patch: Partial<Edge>) => void
  deleteEdge: (id: string) => void

  clear: () => void
  loadProject: (p: Project) => void
  toProject: () => Project
}

import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react'

export const useStore = create<Store>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  projectName: 'My Infrastructure',
  projectDescription: '',
  targetProvider: 'aws',

  setProjectName: (n) => set({ projectName: n }),
  setProjectDescription: (d) => set({ projectDescription: d }),
  setTargetProvider: (p) => set({ targetProvider: p }),

  addNode: (def, position) => {
    const id = `${def.type}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const defaults: Record<string, any> = {}
    for (const p of def.properties) {
      if (p.default !== undefined) defaults[p.key] = p.default
    }
    const node: Node<NodeData> = {
      id,
      type: 'resource',
      position,
      data: {
        resourceType: def.type,
        label: def.label,
        provider: def.provider,
        properties: defaults,
      },
    }
    set((s) => ({ nodes: [...s.nodes, node] }))
  },

  updateNode: (id, patch) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
    })),

  updateNodeProperty: (id, key, value) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id
          ? { ...n, data: { ...n.data, properties: { ...n.data.properties, [key]: value } } }
          : n,
      ),
    })),

  deleteNode: (id) =>
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
    })),

  setSelectedNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),

  onNodesChange: (changes) =>
    set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) as Node<NodeData>[] })),

  onEdgesChange: (changes) =>
    set((s) => ({ edges: applyEdgeChanges(changes, s.edges) })),

  onConnect: (conn) => {
    if (!conn.source || !conn.target) return
    if (conn.source === conn.target) return
    const exists = get().edges.some((e) => (e.source === conn.source && e.target === conn.target) || (e.source === conn.target && e.target === conn.source))
    if (exists) return
    const edge: Edge = {
      id: `e_${conn.source}_${conn.target}_${Date.now()}`,
      source: conn.source,
      target: conn.target,
      type: 'smoothstep',
      animated: false,
      data: { kind: 'connects' },
      label: 'connects',
    }
    set((s) => ({ edges: addEdge(edge, s.edges) }))
  },

  updateEdge: (id, patch) =>
    set((s) => ({
      edges: s.edges.map((e) => (e.id === id ? { ...e, ...patch, data: { ...(e.data ?? {}), ...(patch.data ?? {}) } } : e)),
    })),

  deleteEdge: (id) =>
    set((s) => ({ edges: s.edges.filter((e) => e.id !== id), selectedEdgeId: s.selectedEdgeId === id ? null : s.selectedEdgeId })),

  clear: () => set({ nodes: [], edges: [], selectedNodeId: null, selectedEdgeId: null }),

  loadProject: (p) => {
    const nodes: Node<NodeData>[] = p.nodes.map((n) => ({
      id: n.id,
      type: 'resource',
      position: { x: n.x, y: n.y },
      data: {
        resourceType: n.type,
        label: n.label,
        provider: n.provider,
        properties: n.properties,
      },
      parentId: n.parentId,
    }))
    const edges: Edge[] = p.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'smoothstep',
      data: { kind: e.kind },
      label: e.label ?? e.kind,
    }))
    set({ nodes, edges, projectName: p.name, projectDescription: p.description ?? '', targetProvider: (p.provider as any) ?? 'aws' })
  },

  toProject: () => {
    const s = get()
    const nodes: InfraNode[] = s.nodes.map((n) => ({
      id: n.id,
      type: n.data.resourceType,
      label: n.data.label,
      provider: n.data.provider as any,
      x: n.position.x,
      y: n.position.y,
      properties: n.data.properties,
      parentId: n.parentId,
    }))
    const edges: InfraEdge[] = s.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      kind: (e.data?.kind as any) ?? 'connects',
      label: typeof e.label === 'string' ? e.label : undefined,
    }))
    return {
      name: s.projectName,
      description: s.projectDescription,
      provider: s.targetProvider,
      nodes,
      edges,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },
}))
