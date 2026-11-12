import type { Project, InfraNode, InfraEdge } from '../types/ir'

export function parseProject(input: unknown): Project | null {
  if (!input || typeof input !== 'object') return null
  const p = input as Record<string, unknown>
  if (typeof p.name !== 'string') return null
  if (!Array.isArray(p.nodes) || !Array.isArray(p.edges)) return null

  const nodes: InfraNode[] = []
  for (const raw of p.nodes) {
    if (!raw || typeof raw !== 'object') continue
    const n = raw as Record<string, unknown>
    if (typeof n.id !== 'string' || typeof n.type !== 'string' || typeof n.label !== 'string') continue
    if (typeof n.x !== 'number' || typeof n.y !== 'number') continue
    nodes.push({
      id: n.id,
      type: n.type,
      label: n.label,
      provider: (typeof n.provider === 'string' ? n.provider : 'generic') as any,
      x: n.x,
      y: n.y,
      properties: (n.properties && typeof n.properties === 'object' ? n.properties : {}) as Record<string, any>,
      parentId: typeof n.parentId === 'string' ? n.parentId : undefined,
    })
  }

  const ids = new Set(nodes.map((n) => n.id))
  const edges: InfraEdge[] = []
  for (const raw of p.edges) {
    if (!raw || typeof raw !== 'object') continue
    const e = raw as Record<string, unknown>
    if (typeof e.id !== 'string' || typeof e.source !== 'string' || typeof e.target !== 'string') continue
    if (!ids.has(e.source) || !ids.has(e.target)) continue
    edges.push({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: typeof e.sourceHandle === 'string' ? e.sourceHandle : undefined,
      targetHandle: typeof e.targetHandle === 'string' ? e.targetHandle : undefined,
      kind: (typeof e.kind === 'string' ? e.kind : 'connects') as any,
      label: typeof e.label === 'string' ? e.label : undefined,
    })
  }

  const provider = typeof p.provider === 'string' ? p.provider : 'aws'
  const exportLayout = p.exportLayout === 'single' || p.exportLayout === 'modular' ? p.exportLayout : undefined
  return {
    name: p.name,
    description: typeof p.description === 'string' ? p.description : undefined,
    provider: provider as any,
    ...(exportLayout ? { exportLayout } : {}),
    nodes,
    edges,
    createdAt: typeof p.createdAt === 'string' ? p.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
