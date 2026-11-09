export type Provider =
  | 'aws'
  | 'azure'
  | 'gcp'
  | 'kubernetes'
  | 'docker'
  | 'terraform'
  | 'devops'
  | 'generic'

export type Category =
  | 'network'
  | 'compute'
  | 'storage'
  | 'database'
  | 'security'
  | 'observability'
  | 'cicd'
  | 'messaging'
  | 'identity'
  | 'platform'
  | 'generic'

export type PropertyType = 'string' | 'number' | 'boolean' | 'select' | 'textarea' | 'json'

export interface PropertyDef {
  key: string
  label: string
  type: PropertyType
  default?: string | number | boolean
  options?: { label: string; value: string }[]
  placeholder?: string
  required?: boolean
  help?: string
}

export interface ResourceDef {
  type: string // unique key, also terraform resource type when applicable
  label: string
  provider: Provider
  category: Category
  icon: string // lucide icon name
  color: string // tailwind color token-ish hex
  terraformType?: string
  description?: string
  properties: PropertyDef[]
  // whether it can contain children visually
  container?: boolean
  // default width/height
  size?: { w: number; h: number }
}

export type EdgeKind = 'contains' | 'depends_on' | 'connects' | 'traffic' | 'mounts' | 'routes_to'

export interface InfraNode {
  id: string
  type: string // resource def type
  label: string
  provider: Provider
  x: number
  y: number
  properties: Record<string, any>
  // parent container id
  parentId?: string
}

export interface InfraEdge {
  id: string
  source: string
  target: string
  kind: EdgeKind
  label?: string
}

export interface Project {
  name: string
  description?: string
  provider: 'aws' | 'azure' | 'gcp' | 'multi'
  nodes: InfraNode[]
  edges: InfraEdge[]
  createdAt: string
  updatedAt: string
}

export const EDGE_KINDS: { value: EdgeKind; label: string; color: string; style: string }[] = [
  { value: 'contains', label: 'Contains', color: '#60a5fa', style: 'solid' },
  { value: 'depends_on', label: 'Depends on', color: '#f59e0b', style: 'dashed' },
  { value: 'connects', label: 'Connects', color: '#34d399', style: 'solid' },
  { value: 'traffic', label: 'Traffic', color: '#a78bfa', style: 'animated' },
  { value: 'mounts', label: 'Mounts', color: '#fb7185', style: 'dotted' },
  { value: 'routes_to', label: 'Routes to', color: '#22d3ee', style: 'solid' },
]
