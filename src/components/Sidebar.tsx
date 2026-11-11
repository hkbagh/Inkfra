import { useState, useMemo } from 'react'
import { getIcon } from '../lib/iconMap'
import catalog from '../data/catalog'
import { useStore } from '../store/useStore'
import type { ResourceDef } from '../types/ir'

const PROVIDERS = ['generic', 'aws', 'azure', 'gcp', 'kubernetes', 'docker', 'devops', 'terraform'] as const

export default function Sidebar() {
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
        return r.label.toLowerCase().includes(q) || r.type.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q)
      }
      return true
    })
  }, [query, provider, category])

  const categories = useMemo(() => Array.from(new Set(catalog.map((c) => c.category))), [])

  const onDragStart = (e: React.DragEvent, def: ResourceDef) => {
    e.dataTransfer.setData('application/inkfra-resource', def.type)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <aside className="w-72 shrink-0 border-r themed-border themed-surface flex flex-col">
      <div className="p-3 border-b border-[var(--border)]">
        <div className="text-sm font-semibold mb-2">Resource Library</div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search resources..."
          className="w-full px-3 py-2 rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-sm outline-none focus:border-blue-500"
        />
        <div className="flex gap-2 mt-2">
          <select value={provider} onChange={(e) => setProvider(e.target.value)} className="flex-1 px-2 py-1.5 rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-xs">
            <option value="all">All providers</option>
            {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="flex-1 px-2 py-1.5 rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-xs">
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="text-[11px] text-slate-500 mt-2">{filtered.length} resources</div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.map((def) => {
          const Icon = getIcon(def.icon) || getIcon('Box')
          return (
            <div
              key={def.type}
              draggable
              role="button"
              tabIndex={0}
              onDragStart={(e) => onDragStart(e, def)}
              onClick={() => addNode(def, { x: 120 + (nodeCount % 5) * 220, y: 120 + Math.floor(nodeCount / 5) * 140 })}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addNode(def, { x: 120 + (nodeCount % 5) * 220, y: 120 + Math.floor(nodeCount / 5) * 140 }) } }}
              className="group flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.06] cursor-grab active:cursor-grabbing border border-transparent hover:border-[var(--border)] transition-all duration-150 hover:translate-y-[-1px] hover:shadow-md"
              title={def.description || 'Click or drag to add'}
            >
              <div className="p-1.5 rounded-md" style={{ background: `${def.color}22`, color: def.color }}>
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{def.label}</div>
                <div className="text-[10px] text-slate-500 truncate">{def.provider} · {def.category}</div>
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
