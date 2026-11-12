import { create } from 'zustand'
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  reconnectEdge,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from '@xyflow/react'
import type { ExportLayout, InfraEdge, InfraNode, Project, ResourceDef } from '../types/ir'
import { parseProject } from '../lib/project'
import { parseTerraformToProject, type TfInputFile } from '../lib/tfImport'
import catalog from '../data/catalog'

export interface NodeData {
  resourceType: string
  label: string
  provider: string
  properties: Record<string, any>
  [key: string]: unknown
}

interface Snapshot {
  nodes: Node<NodeData>[]
  edges: Edge[]
  projectName: string
  projectDescription: string
  targetProvider: 'aws' | 'azure' | 'gcp' | 'multi'
  exportLayout: ExportLayout
}

const MAX_HISTORY = 50
const AUTOSAVE_KEY = 'inkfra:autosave:v1'

function cloneSnapshot(s: Snapshot): Snapshot {
  return {
    nodes: s.nodes.map((n) => ({
      ...n,
      position: { ...n.position },
      data: { ...n.data, properties: { ...n.data.properties } },
    })),
    edges: s.edges.map((e) => ({ ...e, data: e.data ? { ...e.data } : undefined })),
    projectName: s.projectName,
    projectDescription: s.projectDescription,
    targetProvider: s.targetProvider,
    exportLayout: s.exportLayout,
  }
}

function getTierRank(resourceType: string): number {
  if (resourceType === 'aws_vpc' || resourceType === 'azurerm_resource_group' || resourceType === 'google_compute_network') {
    return 0
  }
  if (
    resourceType.includes('subnet') ||
    resourceType.includes('virtual_network') ||
    resourceType.includes('internet_gateway') ||
    resourceType.includes('nat_gateway') ||
    resourceType.includes('route_table') ||
    resourceType === 'k8s_namespace'
  ) {
    return 1
  }
  const def = catalog.find((c) => c.type === resourceType)
  switch (def?.category) {
    case 'generic':
    case 'network':
    case 'security':
    case 'identity':
      return 2
    case 'compute':
    case 'platform':
      return 3
    case 'database':
    case 'storage':
    case 'messaging':
    case 'observability':
      return 4
    default:
      return 5
  }
}

function loadAutosavedProject(): Project | null {
  try {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return null
    const raw = window.localStorage.getItem(AUTOSAVE_KEY)
    if (!raw) return null
    return parseProject(JSON.parse(raw))
  } catch {
    return null
  }
}

let autosaveTimer: ReturnType<typeof setTimeout> | null = null
let lastCoalesceAt = 0
let lastCoalesceTag = ''

function scheduleAutosave(getProject: () => Project) {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return
  if (autosaveTimer) clearTimeout(autosaveTimer)
  autosaveTimer = setTimeout(() => {
    try {
      const p = getProject()
      if (p.nodes.length === 0 && p.edges.length === 0 && p.name === 'My Infrastructure' && !p.description) {
        window.localStorage.removeItem(AUTOSAVE_KEY)
      } else {
        window.localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(p))
      }
    } catch {
      // ignore storage quota / privacy mode errors
    }
  }, 300)
}

function projectToFlow(p: Project): { nodes: Node<NodeData>[]; edges: Edge[] } {
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
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    type: 'infra',
    data: { kind: e.kind },
    label: e.label ?? e.kind,
  }))
  return { nodes, edges }
}

interface Store {
  nodes: Node<NodeData>[]
  edges: Edge[]
  selectedNodeId: string | null
  selectedEdgeId: string | null
  projectName: string
  projectDescription: string
  targetProvider: 'aws' | 'azure' | 'gcp' | 'multi'
  exportLayout: ExportLayout
  fitViewSignal: number
  focusNodeId: string | null
  focusSignal: number
  connectMode: boolean
  past: Snapshot[]
  future: Snapshot[]
  canUndo: boolean
  canRedo: boolean

  setProjectName: (n: string) => void
  setProjectDescription: (d: string) => void
  setTargetProvider: (p: Store['targetProvider']) => void
  setExportLayout: (layout: ExportLayout) => void

  addNode: (def: ResourceDef, position: { x: number; y: number }) => void
  updateNode: (id: string, patch: Partial<NodeData>) => void
  updateNodeProperty: (id: string, key: string, value: any) => void
  deleteNode: (id: string) => void
  duplicateSelected: () => void
  autoLayout: () => void
  recordHistorySnapshot: () => void
  undo: () => void
  redo: () => void

  setSelectedNode: (id: string | null) => void
  setSelectedEdge: (id: string | null) => void
  focusNode: (id: string) => void
  setConnectMode: (enabled: boolean) => void
  toggleConnectMode: () => void

  onNodesChange: (changes: NodeChange<Node<NodeData>>[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (conn: Connection) => void
  onReconnect: (oldEdge: Edge, newConn: Connection) => void
  updateEdge: (id: string, patch: Partial<Edge>) => void
  deleteEdge: (id: string) => void

  clear: () => void
  loadProject: (p: Project) => void
  importTerraform: (files: TfInputFile[], name?: string) => Project
  toProject: () => Project
}

const saved = loadAutosavedProject()
const initialFlow = saved ? projectToFlow(saved) : { nodes: [], edges: [] }

export const useStore = create<Store>((set, get) => {
  const pushHistory = (coalesceTag?: string) => {
    const now = Date.now()
    if (coalesceTag && coalesceTag === lastCoalesceTag && now - lastCoalesceAt < 650) {
      lastCoalesceAt = now
      return
    }
    lastCoalesceTag = coalesceTag ?? ''
    lastCoalesceAt = now
    const s = get()
    const snap = cloneSnapshot({
      nodes: s.nodes,
      edges: s.edges,
      projectName: s.projectName,
      projectDescription: s.projectDescription,
      targetProvider: s.targetProvider,
      exportLayout: s.exportLayout,
    })
    const nextPast = [...s.past.slice(-(MAX_HISTORY - 1)), snap]
    set({ past: nextPast, future: [], canUndo: true, canRedo: false })
  }

  return {
    nodes: initialFlow.nodes,
    edges: initialFlow.edges,
    selectedNodeId: null,
    selectedEdgeId: null,
    projectName: saved?.name ?? 'My Infrastructure',
    projectDescription: saved?.description ?? '',
    targetProvider: (saved?.provider as Store['targetProvider']) ?? 'aws',
    exportLayout: saved?.exportLayout ?? 'modular',
    fitViewSignal: saved && initialFlow.nodes.length > 0 ? 1 : 0,
    focusNodeId: null,
    focusSignal: 0,
    connectMode: false,
    past: [],
    future: [],
    canUndo: false,
    canRedo: false,

    recordHistorySnapshot: () => pushHistory(),

    undo: () => {
      const s = get()
      if (s.past.length === 0) return
      const prev = s.past[s.past.length - 1]
      const currentSnap = cloneSnapshot({
        nodes: s.nodes,
        edges: s.edges,
        projectName: s.projectName,
        projectDescription: s.projectDescription,
        targetProvider: s.targetProvider,
        exportLayout: s.exportLayout,
      })
      const nextPast = s.past.slice(0, -1)
      const nextFuture = [currentSnap, ...s.future].slice(0, MAX_HISTORY)
      set({
        ...cloneSnapshot(prev),
        past: nextPast,
        future: nextFuture,
        canUndo: nextPast.length > 0,
        canRedo: nextFuture.length > 0,
        selectedNodeId: null,
        selectedEdgeId: null,
      })
      scheduleAutosave(get().toProject)
    },

    redo: () => {
      const s = get()
      if (s.future.length === 0) return
      const next = s.future[0]
      const currentSnap = cloneSnapshot({
        nodes: s.nodes,
        edges: s.edges,
        projectName: s.projectName,
        projectDescription: s.projectDescription,
        targetProvider: s.targetProvider,
        exportLayout: s.exportLayout,
      })
      const nextPast = [...s.past.slice(-(MAX_HISTORY - 1)), currentSnap]
      const nextFuture = s.future.slice(1)
      set({
        ...cloneSnapshot(next),
        past: nextPast,
        future: nextFuture,
        canUndo: nextPast.length > 0,
        canRedo: nextFuture.length > 0,
        selectedNodeId: null,
        selectedEdgeId: null,
      })
      scheduleAutosave(get().toProject)
    },

    setProjectName: (n) => {
      pushHistory('projectName')
      set({ projectName: n })
      scheduleAutosave(get().toProject)
    },
    setProjectDescription: (d) => {
      pushHistory('projectDesc')
      set({ projectDescription: d })
      scheduleAutosave(get().toProject)
    },
    setTargetProvider: (p) => {
      pushHistory()
      set({ targetProvider: p })
      scheduleAutosave(get().toProject)
    },
    setExportLayout: (layout) => {
      pushHistory()
      set({ exportLayout: layout })
      scheduleAutosave(get().toProject)
    },

    addNode: (def, position) => {
      pushHistory()
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
      set((s) => ({ nodes: [...s.nodes, node], selectedNodeId: id, selectedEdgeId: null }))
      scheduleAutosave(get().toProject)
    },

    updateNode: (id, patch) => {
      pushHistory(`node:${id}`)
      set((s) => ({
        nodes: s.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
      }))
      scheduleAutosave(get().toProject)
    },

    updateNodeProperty: (id, key, value) => {
      pushHistory(`prop:${id}:${key}`)
      set((s) => ({
        nodes: s.nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, properties: { ...n.data.properties, [key]: value } } } : n,
        ),
      }))
      scheduleAutosave(get().toProject)
    },

    deleteNode: (id) => {
      pushHistory()
      set((s) => ({
        nodes: s.nodes.filter((n) => n.id !== id),
        edges: s.edges.filter((e) => e.source !== id && e.target !== id),
        selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
      }))
      scheduleAutosave(get().toProject)
    },

    duplicateSelected: () => {
      const s = get()
      const targets = s.nodes.filter((n) => n.selected || n.id === s.selectedNodeId)
      if (targets.length === 0) return
      pushHistory()
      const clones: Node<NodeData>[] = targets.map((n, idx) => ({
        ...n,
        id: `${n.data.resourceType}_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        position: { x: n.position.x + 32, y: n.position.y + 32 },
        selected: true,
        data: {
          ...n.data,
          label: `${n.data.label} Copy`,
          properties: { ...n.data.properties },
        },
      }))
      set({
        nodes: [...s.nodes.map((n) => ({ ...n, selected: false })), ...clones],
        selectedNodeId: clones.length === 1 ? clones[0].id : null,
        selectedEdgeId: null,
      })
      scheduleAutosave(get().toProject)
    },

    autoLayout: () => {
      const s = get()
      if (s.nodes.length === 0) return
      pushHistory()
      const buckets = new Map<number, Node<NodeData>[]>()
      for (const n of s.nodes) {
        const tier = getTierRank(n.data.resourceType)
        if (!buckets.has(tier)) buckets.set(tier, [])
        buckets.get(tier)!.push(n)
      }
      const tiers = Array.from(buckets.keys()).sort((a, b) => a - b)
      const positioned = new Map<string, { x: number; y: number }>()
      tiers.forEach((tier, colIdx) => {
        const list = buckets.get(tier)!.slice().sort((a, b) => a.position.y - b.position.y || a.data.label.localeCompare(b.data.label))
        list.forEach((n, rowIdx) => {
          positioned.set(n.id, {
            x: 80 + colIdx * 288,
            y: 80 + rowIdx * 144,
          })
        })
      })
      set((state) => ({
        nodes: state.nodes.map((n) => ({ ...n, position: positioned.get(n.id) ?? n.position })),
        fitViewSignal: state.fitViewSignal + 1,
      }))
      scheduleAutosave(get().toProject)
    },

    setSelectedNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
    setSelectedEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
    focusNode: (id) =>
      set((s) => ({
        selectedNodeId: id,
        selectedEdgeId: null,
        focusNodeId: id,
        focusSignal: s.focusSignal + 1,
      })),
    setConnectMode: (enabled) => set({ connectMode: enabled }),
    toggleConnectMode: () => set((s) => ({ connectMode: !s.connectMode })),

    onNodesChange: (changes) => {
      const hasRemoval = changes.some((c) => c.type === 'remove')
      if (hasRemoval) pushHistory()
      set((s) => {
        const nextNodes = applyNodeChanges(changes, s.nodes) as Node<NodeData>[]
        const remainingIds = new Set(nextNodes.map((n) => n.id))
        return {
          nodes: nextNodes,
          selectedNodeId: s.selectedNodeId && remainingIds.has(s.selectedNodeId) ? s.selectedNodeId : null,
        }
      })
      if (hasRemoval) scheduleAutosave(get().toProject)
    },

    onEdgesChange: (changes) => {
      const hasRemoval = changes.some((c) => c.type === 'remove')
      if (hasRemoval) pushHistory()
      set((s) => {
        const nextEdges = applyEdgeChanges(changes, s.edges)
        const remainingIds = new Set(nextEdges.map((e) => e.id))
        return {
          edges: nextEdges,
          selectedEdgeId: s.selectedEdgeId && remainingIds.has(s.selectedEdgeId) ? s.selectedEdgeId : null,
        }
      })
      if (hasRemoval) scheduleAutosave(get().toProject)
    },

    onConnect: (conn) => {
      if (!conn.source || !conn.target) return
      if (conn.source === conn.target) return
      const exists = get().edges.some(
        (e) =>
          (e.source === conn.source && e.target === conn.target) ||
          (e.source === conn.target && e.target === conn.source),
      )
      if (exists) return
      pushHistory()
      const edge: Edge = {
        id: `e_${conn.source}_${conn.target}_${Date.now()}`,
        source: conn.source,
        target: conn.target,
        sourceHandle: conn.sourceHandle ?? undefined,
        targetHandle: conn.targetHandle ?? undefined,
        type: 'infra',
        animated: false,
        data: { kind: 'connects' },
        label: 'connects',
      }
      set((s) => ({ edges: addEdge(edge, s.edges) }))
      scheduleAutosave(get().toProject)
    },

    onReconnect: (oldEdge, newConn) => {
      if (!newConn.source || !newConn.target || newConn.source === newConn.target) return
      const duplicate = get().edges.some(
        (e) =>
          e.id !== oldEdge.id &&
          ((e.source === newConn.source && e.target === newConn.target) ||
            (e.source === newConn.target && e.target === newConn.source)),
      )
      if (duplicate) return
      pushHistory()
      set((s) => ({ edges: reconnectEdge(oldEdge, newConn, s.edges) }))
      scheduleAutosave(get().toProject)
    },

    updateEdge: (id, patch) => {
      pushHistory(`edge:${id}`)
      set((s) => ({
        edges: s.edges.map((e) =>
          e.id === id ? { ...e, ...patch, data: { ...(e.data ?? {}), ...(patch.data ?? {}) } } : e,
        ),
      }))
      scheduleAutosave(get().toProject)
    },

    deleteEdge: (id) => {
      pushHistory()
      set((s) => ({
        edges: s.edges.filter((e) => e.id !== id),
        selectedEdgeId: s.selectedEdgeId === id ? null : s.selectedEdgeId,
      }))
      scheduleAutosave(get().toProject)
    },

    clear: () => {
      pushHistory()
      set({ nodes: [], edges: [], selectedNodeId: null, selectedEdgeId: null })
      scheduleAutosave(get().toProject)
    },

    loadProject: (p) => {
      pushHistory()
      const { nodes, edges } = projectToFlow(p)
      set((s) => ({
        nodes,
        edges,
        projectName: p.name,
        projectDescription: p.description ?? '',
        targetProvider: (p.provider as Store['targetProvider']) ?? 'aws',
        exportLayout: p.exportLayout ?? 'modular',
        selectedNodeId: null,
        selectedEdgeId: null,
        fitViewSignal: s.fitViewSignal + 1,
      }))
      scheduleAutosave(get().toProject)
    },

    importTerraform: (files, name) => {
      const parsed = parseTerraformToProject(files, name || 'Imported Terraform')
      get().loadProject(parsed)
      if (parsed.nodes.length > 0) {
        get().autoLayout()
      }
      return parsed
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
        sourceHandle: e.sourceHandle ?? undefined,
        targetHandle: e.targetHandle ?? undefined,
        kind: (e.data?.kind as any) ?? 'connects',
        label: typeof e.label === 'string' ? e.label : undefined,
      }))
      return {
        name: s.projectName,
        description: s.projectDescription,
        provider: s.targetProvider,
        exportLayout: s.exportLayout,
        nodes,
        edges,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    },
  }
})
