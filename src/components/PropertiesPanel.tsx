import { createElement } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeftRight,
  ArrowRight,
  Boxes,
  Clock,
  Copy,
  GitBranch,
  HardDrive,
  Link2,
  MousePointer2,
  SlidersHorizontal,
  Trash2,
  X,
  Zap,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import catalog from '../data/catalog'
import { EDGE_KINDS } from '../types/ir'
import { getIcon } from '../lib/iconMap'
import { BRANDED_RESOURCE_TYPES } from '../lib/brandMeta'
import { ProviderLogo } from './BrandLogos'

interface PropertiesPanelProps {
  open: boolean
  onClose: () => void
}

function EdgeKindMiniIcon({ kind }: { kind: string }) {
  switch (kind) {
    case 'contains':
      return <Boxes size={13} />
    case 'depends_on':
      return <Clock size={13} />
    case 'traffic':
      return <Zap size={13} />
    case 'mounts':
      return <HardDrive size={13} />
    case 'routes_to':
      return <ArrowRight size={13} />
    default:
      return <Link2 size={13} />
  }
}

export default function PropertiesPanel({ open, onClose }: PropertiesPanelProps) {
  const selectedNodeId = useStore((s) => s.selectedNodeId)
  const selectedEdgeId = useStore((s) => s.selectedEdgeId)
  const nodes = useStore((s) => s.nodes)
  const edges = useStore((s) => s.edges)
  const updateNode = useStore((s) => s.updateNode)
  const updateNodeProperty = useStore((s) => s.updateNodeProperty)
  const duplicateSelected = useStore((s) => s.duplicateSelected)
  const deleteNode = useStore((s) => s.deleteNode)
  const updateEdge = useStore((s) => s.updateEdge)
  const deleteEdge = useStore((s) => s.deleteEdge)

  const node = nodes.find((n) => n.id === selectedNodeId)
  const edge = edges.find((e) => e.id === selectedEdgeId)
  const def = node ? catalog.find((c) => c.type === node.data.resourceType) : undefined

  const renderPanelBody = () => {
    if (!node && !edge) {
      return (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex h-full flex-col"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-3 text-sm font-semibold">
            <span className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-[var(--text-muted)]" />
              Properties
            </span>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-icon h-7 w-7 lg:hidden"
              aria-label="Close properties"
            >
              <X size={15} />
            </button>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] shadow-[var(--shadow-sm)]">
              <MousePointer2 size={20} />
            </div>
            <div className="mt-4 text-sm font-medium text-[var(--text)]">Nothing selected</div>
            <div className="mt-1.5 max-w-[15rem] text-xs leading-relaxed text-[var(--text-muted)]">
              Select a resource or connector on the canvas to edit its properties.
            </div>
          </div>
          <div className="border-t border-[var(--border)] p-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
              <div className="text-xs font-semibold text-[var(--text)]">Connector tip</div>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">
                Drag from any handle to wire resources. Draw containment edges from child to parent (e.g. Subnet → VPC).
              </p>
            </div>
          </div>
        </motion.div>
      )
    }

    if (edge) {
      const source = nodes.find((n) => n.id === edge.source)
      const target = nodes.find((n) => n.id === edge.target)
      const kind = (edge.data?.kind as string) ?? 'connects'
      const kindDef = EDGE_KINDS.find((k) => k.value === kind) ?? EDGE_KINDS[2]

      return (
        <motion.div
          key={`edge-${edge.id}`}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.16 }}
          className="flex h-full flex-col"
        >
          <div className="border-b border-[var(--border)] p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-start gap-2.5">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
                  style={{
                    color: kindDef.color,
                    borderColor: `${kindDef.color}44`,
                    background: `${kindDef.color}18`,
                  }}
                >
                  <GitBranch size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">Connector</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                    <span className="truncate font-medium text-[var(--text)]">{source?.data.label ?? edge.source}</span>
                    <ArrowRight size={11} className="shrink-0 text-[var(--text-muted)]" />
                    <span className="truncate font-medium text-[var(--text)]">{target?.data.label ?? edge.target}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost btn-icon h-7 w-7 shrink-0 lg:hidden"
                aria-label="Close properties"
              >
                <X size={15} />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold"
                style={{
                  color: kindDef.color,
                  borderColor: `${kindDef.color}44`,
                  background: `${kindDef.color}16`,
                }}
              >
                <EdgeKindMiniIcon kind={kind} />
                {kindDef.label}
              </span>
              <button
                type="button"
                onClick={() => updateEdge(edge.id, { source: edge.target, target: edge.source })}
                className="btn btn-secondary h-7 px-2 text-[11px]"
                title="Swap source and target direction"
              >
                <ArrowLeftRight size={12} />
                Swap direction
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div>
              <div className="mb-2 text-[11px] font-medium text-[var(--text-muted)]">Connector kind</div>
              <div className="grid grid-cols-2 gap-1.5">
                {EDGE_KINDS.map((k) => {
                  const active = kind === k.value
                  return (
                    <button
                      key={k.value}
                      type="button"
                      onClick={() => updateEdge(edge.id, { data: { kind: k.value }, label: k.value })}
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-all ${
                        active
                          ? 'bg-[var(--surface-3)] text-[var(--text)] shadow-sm'
                          : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]'
                      }`}
                      style={
                        active
                          ? {
                              borderColor: k.color,
                              boxShadow: `0 0 0 2px ${k.color}22`,
                            }
                          : undefined
                      }
                    >
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                        style={{ color: k.color, background: `${k.color}1f` }}
                      >
                        <EdgeKindMiniIcon kind={k.value} />
                      </span>
                      <span className="truncate">{k.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <label className="block">
              <span className="text-[11px] font-medium text-[var(--text-muted)]">Label</span>
              <input
                value={(edge.label as string) ?? ''}
                onChange={(e) => updateEdge(edge.id, { label: e.target.value })}
                className="input mt-1 w-full"
                placeholder="Optional label"
              />
            </label>
          </div>

          <div className="border-t border-[var(--border)] p-4">
            <button type="button" onClick={() => deleteEdge(edge.id)} className="btn btn-danger w-full">
              <Trash2 size={14} />
              Delete Connector
            </button>
          </div>
        </motion.div>
      )
    }

    if (!node) return null

    const Icon = def ? getIcon(def.icon) : getIcon('Box')
    const color = def?.color ?? '#64748b'
    const isBranded = BRANDED_RESOURCE_TYPES.has(node.data.resourceType)

    return (
      <motion.div
        key={`node-${node.id}`}
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -8 }}
        transition={{ duration: 0.16 }}
        className="flex h-full flex-col"
      >
        <div className="border-b border-[var(--border)] p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-start gap-2.5">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: `${color}1f`,
                  color,
                  boxShadow: `inset 0 0 0 1px ${color}38`,
                }}
              >
                {isBranded ? (
                  <ProviderLogo provider={node.data.provider} resourceType={node.data.resourceType} size={18} />
                ) : (
                  createElement(Icon, { size: 16 })
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{def?.label ?? node.data.resourceType}</div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                  <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-medium uppercase">
                    <ProviderLogo provider={node.data.provider} size={11} />
                    {node.data.provider}
                  </span>
                  <span className="truncate text-[10px]">{def?.terraformType ?? node.data.resourceType}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-icon h-7 w-7 shrink-0 lg:hidden"
              aria-label="Close properties"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <label className="block">
            <span className="text-[11px] font-medium text-[var(--text-muted)]">Label</span>
            <input
              value={node.data.label}
              onChange={(e) => updateNode(node.id, { label: e.target.value })}
              className="input mt-1 w-full"
            />
          </label>

          {def?.properties.map((p) => {
            const val = node.data.properties?.[p.key]

            if (p.type === 'boolean') {
              return (
                <label
                  key={p.key}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 transition-colors hover:border-[var(--border-strong)]"
                >
                  <input
                    type="checkbox"
                    checked={!!val}
                    onChange={(e) => updateNodeProperty(node.id, p.key, e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent)]"
                  />
                  <span className="text-xs font-medium text-[var(--text)]">{p.label}</span>
                </label>
              )
            }
            if (p.type === 'select') {
              return (
                <label key={p.key} className="block">
                  <span className="text-[11px] font-medium text-[var(--text-muted)]">
                    {p.label}
                    {p.required && <span className="ml-0.5 text-amber-400">*</span>}
                  </span>
                  <select
                    value={val ?? p.default}
                    onChange={(e) => updateNodeProperty(node.id, p.key, e.target.value)}
                    className="select mt-1 w-full"
                  >
                    {p.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              )
            }
            if (p.type === 'textarea' || p.type === 'json') {
              return (
                <label key={p.key} className="block">
                  <span className="text-[11px] font-medium text-[var(--text-muted)]">
                    {p.label}
                    {p.required && <span className="ml-0.5 text-amber-400">*</span>}
                  </span>
                  <textarea
                    value={val ?? ''}
                    onChange={(e) => updateNodeProperty(node.id, p.key, e.target.value)}
                    className="input mt-1 min-h-20 w-full py-2"
                    rows={3}
                    placeholder={p.placeholder}
                  />
                </label>
              )
            }
            if (p.type === 'number') {
              return (
                <label key={p.key} className="block">
                  <span className="text-[11px] font-medium text-[var(--text-muted)]">
                    {p.label}
                    {p.required && <span className="ml-0.5 text-amber-400">*</span>}
                  </span>
                  <input
                    type="number"
                    value={val ?? ''}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === '') {
                        updateNodeProperty(node.id, p.key, '')
                        return
                      }
                      const n = Number(v)
                      if (!Number.isNaN(n)) updateNodeProperty(node.id, p.key, n)
                    }}
                    className="input mt-1 w-full"
                    placeholder={p.placeholder}
                  />
                </label>
              )
            }
            return (
              <label key={p.key} className="block">
                <span className="text-[11px] font-medium text-[var(--text-muted)]">
                  {p.label}
                  {p.required && <span className="ml-0.5 text-amber-400">*</span>}
                </span>
                <input
                  value={val ?? ''}
                  onChange={(e) => updateNodeProperty(node.id, p.key, e.target.value)}
                  className="input mt-1 w-full"
                  placeholder={p.placeholder}
                />
              </label>
            )
          })}
        </div>

        <div className="flex gap-2 border-t border-[var(--border)] p-4">
          <button
            type="button"
            onClick={duplicateSelected}
            className="btn btn-secondary flex-1"
            title="Duplicate resource (Ctrl+D)"
          >
            <Copy size={14} />
            Duplicate
          </button>
          <button type="button" onClick={() => deleteNode(node.id)} className="btn btn-danger flex-1">
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <>
      {/* Desktop docked right rail */}
      <aside
        className={`hidden shrink-0 overflow-hidden border-l border-[var(--border)] bg-[var(--surface)] transition-[width] duration-200 ease-out lg:block ${
          open ? 'w-80' : 'w-0 border-l-0'
        }`}
      >
        <div className="h-full w-80">
          <AnimatePresence mode="wait">{renderPanelBody()}</AnimatePresence>
        </div>
      </aside>

      {/* Mobile / tablet slide-over drawer */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-40 flex justify-end lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={onClose}
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              className="relative z-10 h-full w-[min(90vw,330px)] border-l border-[var(--border)] bg-[var(--surface)] shadow-2xl"
            >
              <AnimatePresence mode="wait">{renderPanelBody()}</AnimatePresence>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
