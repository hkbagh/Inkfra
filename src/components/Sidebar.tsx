import { useMemo, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Search, X } from 'lucide-react'
import { getIcon } from '../lib/iconMap'
import { BRANDED_RESOURCE_TYPES, getProviderMeta } from '../lib/brandMeta'
import catalog from '../data/catalog'
import { useStore } from '../store/useStore'
import type { ResourceDef } from '../types/ir'
import { ProviderLogo } from './BrandLogos'

const PROVIDERS = ['aws', 'azure', 'gcp', 'kubernetes', 'docker', 'devops', 'terraform', 'generic'] as const

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const [query, setQuery] = useState('')
  const [provider, setProvider] = useState<string>('all')
  const [category, setCategory] = useState<string>('all')
  const addNode = useStore((s) => s.addNode)
  const nodeCount = useStore((s) => s.nodes.length)

  const filtered = useMemo(() => {
    return catalog.filter((r) => {
      if (provider !== 'all' && r.provider !== provider) return false
      if (category !== 'all' && r.category !== category) return false
      if (query) {
        const q = query.toLowerCase()
        return (
          r.label.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          (r.description ?? '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [query, provider, category])

  const categories = useMemo(() => Array.from(new Set(catalog.map((c) => c.category))), [])

  const addAtNextSlot = (def: ResourceDef) => {
    addNode(def, {
      x: 120 + (nodeCount % 5) * 220,
      y: 120 + Math.floor(nodeCount / 5) * 140,
    })
    if (window.innerWidth < 1024) {
      onClose()
    }
  }

  const onDragStart = (e: React.DragEvent, def: ResourceDef) => {
    e.dataTransfer.setData('application/inkfra-resource', def.type)
    e.dataTransfer.effectAllowed = 'move'
  }

  const resetFilters = () => {
    setQuery('')
    setProvider('all')
    setCategory('all')
  }

  const content = (
    <div className="flex h-full w-72 shrink-0 flex-col bg-[var(--surface)] sm:w-76 lg:w-72">
      <div className="border-b border-[var(--border)] p-3">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight">Resource Library</span>
            <span className="chip chip-accent">{filtered.length}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon h-7 w-7 lg:hidden"
            aria-label="Close resource library"
          >
            <X size={15} />
          </button>
        </div>

        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            data-resource-search
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resources..."
            className="input w-full pl-8 pr-8"
            aria-label="Search resources"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-[var(--text-muted)] transition-colors hover:bg-white/5 hover:text-[var(--text)]"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Provider logo pills */}
        <div className="mt-2.5 flex gap-1 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setProvider('all')}
            className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-all ${
              provider === 'all'
                ? 'border-blue-400/50 bg-[var(--accent-soft)] text-blue-200'
                : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]'
            }`}
          >
            All
          </button>
          {PROVIDERS.map((p) => {
            const meta = getProviderMeta(p)
            const active = provider === p
            return (
              <button
                key={p}
                type="button"
                onClick={() => setProvider(active ? 'all' : p)}
                title={meta.label}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium transition-all ${
                  active
                    ? 'border-blue-400/50 bg-[var(--accent-soft)] text-[var(--text)] shadow-sm'
                    : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]'
                }`}
              >
                <ProviderLogo provider={p} size={13} />
                <span>{meta.shortLabel}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="select w-full text-xs"
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-5 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]">
              <Search size={17} />
            </div>
            <div className="mt-3 text-sm font-medium">No resources found</div>
            <div className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
              Try a different search or reset the filters.
            </div>
            <button type="button" onClick={resetFilters} className="btn btn-secondary mt-4">
              Reset filters
            </button>
          </div>
        ) : (
          filtered.map((def) => {
            const Icon = getIcon(def.icon)
            const isBranded = BRANDED_RESOURCE_TYPES.has(def.type)
            return (
              <div
                key={def.type}
                draggable
                role="button"
                tabIndex={0}
                onDragStart={(e) => onDragStart(e, def)}
                onClick={() => addAtNextSlot(def)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    addAtNextSlot(def)
                  }
                }}
                className="resource-item group relative flex cursor-grab items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 transition-all duration-150 hover:border-[var(--border)] hover:bg-white/[0.045] hover:shadow-sm active:scale-[0.99] active:cursor-grabbing"
                style={{ '--resource-color': def.color } as CSSProperties}
                title={def.description || 'Click or drag to add'}
                aria-label={`Add ${def.label}`}
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-transform duration-150 group-hover:scale-105"
                  style={{
                    background: `${def.color}1f`,
                    color: def.color,
                    boxShadow: `inset 0 0 0 1px ${def.color}33`,
                  }}
                >
                  {isBranded ? (
                    <ProviderLogo provider={def.provider} resourceType={def.type} size={15} />
                  ) : (
                    <Icon size={14} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-[var(--text)]">{def.label}</div>
                  <div className="truncate text-[10px] text-[var(--text-muted)]">
                    {def.provider} · {def.category}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="opacity-70 transition-opacity group-hover:opacity-100">
                    <ProviderLogo provider={def.provider} size={12} />
                  </span>
                  <Plus
                    size={13}
                    className="text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="border-t border-[var(--border)] px-3 py-2.5 text-[10px] leading-relaxed text-[var(--text-muted)]">
        Drag a resource onto the canvas or click to add it.
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop docked rail */}
      <aside
        className={`hidden shrink-0 overflow-hidden border-r border-[var(--border)] bg-[var(--surface)] transition-[width] duration-200 ease-out lg:block ${
          open ? 'w-72' : 'w-0 border-r-0'
        }`}
      >
        {content}
      </aside>

      {/* Mobile / tablet slide-over drawer */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={onClose}
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              className="relative z-10 h-full border-r border-[var(--border)] bg-[var(--surface)] shadow-2xl"
            >
              {content}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
