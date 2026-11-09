import { useStore } from '../store/useStore'
import catalog from '../data/catalog'
import { EDGE_KINDS } from '../types/ir'

export default function PropertiesPanel() {
  const selectedNodeId = useStore((s) => s.selectedNodeId)
  const selectedEdgeId = useStore((s) => s.selectedEdgeId)
  const nodes = useStore((s) => s.nodes)
  const edges = useStore((s) => s.edges)
  const updateNode = useStore((s) => s.updateNode)
  const updateNodeProperty = useStore((s) => s.updateNodeProperty)
  const deleteNode = useStore((s) => s.deleteNode)
  const updateEdge = useStore((s) => s.updateEdge)
  const deleteEdge = useStore((s) => s.deleteEdge)

  const node = nodes.find((n) => n.id === selectedNodeId)
  const edge = edges.find((e) => e.id === selectedEdgeId)
  const def = node ? catalog.find((c) => c.type === node.data.resourceType) : undefined

  if (!node && !edge) {
    return (
      <aside className="w-80 shrink-0 border-l border-white/10 bg-slate-950/80 p-4 text-sm text-slate-400">
        <div className="font-semibold text-slate-200 mb-2">Properties</div>
        Select a node or connection to edit its properties.
      </aside>
    )
  }

  if (edge) {
    return (
      <aside className="w-80 shrink-0 border-l border-white/10 bg-slate-950/80 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <div className="font-semibold text-slate-200">Connection</div>
          <div className="text-xs text-slate-500 mt-1">{edge.source} → {edge.target}</div>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          <label className="block">
            <span className="text-xs text-slate-400">Kind</span>
            <select
              value={(edge.data?.kind as string) ?? 'connects'}
              onChange={(e) => updateEdge(edge.id, { data: { kind: e.target.value }, label: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-md bg-slate-900 border border-white/10 text-sm"
            >
              {EDGE_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">Label</span>
            <input
              value={(edge.label as string) ?? ''}
              onChange={(e) => updateEdge(edge.id, { label: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-md bg-slate-900 border border-white/10 text-sm"
            />
          </label>
        </div>
        <div className="p-4 border-t border-white/10">
          <button onClick={() => deleteEdge(edge.id)} className="w-full px-3 py-2 rounded-md bg-red-600/20 text-red-300 hover:bg-red-600/30 text-sm">Delete Connection</button>
        </div>
      </aside>
    )
  }

  if (!node) return null

  return (
    <aside className="w-80 shrink-0 border-l border-white/10 bg-slate-950/80 flex flex-col">
      <div className="p-4 border-b border-white/10">
        <div className="font-semibold text-slate-200">{def?.label ?? node.data.resourceType}</div>
        <div className="text-xs text-slate-500 mt-1">{node.data.resourceType}</div>
      </div>
      <div className="p-4 space-y-3 overflow-y-auto flex-1">
        <label className="block">
          <span className="text-xs text-slate-400">Label</span>
          <input
            value={node.data.label}
            onChange={(e) => updateNode(node.id, { label: e.target.value })}
            className="mt-1 w-full px-3 py-2 rounded-md bg-slate-900 border border-white/10 text-sm"
          />
        </label>
        {def?.properties.map((p: any) => {
          const val = node.data.properties?.[p.key]
          const common = "mt-1 w-full px-3 py-2 rounded-md bg-slate-900 border border-white/10 text-sm"
          if (p.type === 'boolean') {
            return (
              <label key={p.key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!val}
                  onChange={(e) => updateNodeProperty(node.id, p.key, e.target.checked)}
                />
                <span className="text-sm">{p.label}</span>
              </label>
            )
          }
          if (p.type === 'select') {
            return (
              <label key={p.key} className="block">
                <span className="text-xs text-slate-400">{p.label}</span>
                <select value={val ?? p.default} onChange={(e) => updateNodeProperty(node.id, p.key, e.target.value)} className={common}>
                  {p.options?.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
            )
          }
          if (p.type === 'textarea' || p.type === 'json') {
            return (
              <label key={p.key} className="block">
                <span className="text-xs text-slate-400">{p.label}</span>
                <textarea value={val ?? ''} onChange={(e) => updateNodeProperty(node.id, p.key, e.target.value)} className={common} rows={3} placeholder={p.placeholder} />
              </label>
            )
          }
          if (p.type === 'number') {
            return (
              <label key={p.key} className="block">
                <span className="text-xs text-slate-400">{p.label}</span>
                <input type="number" value={val ?? ''} onChange={(e) => {
                const v = e.target.value
                if (v === '') { updateNodeProperty(node.id, p.key, ''); return }
                const n = Number(v)
                if (!Number.isNaN(n)) updateNodeProperty(node.id, p.key, n)
              }} className={common} placeholder={p.placeholder} />
              </label>
            )
          }
          return (
            <label key={p.key} className="block">
              <span className="text-xs text-slate-400">{p.label}</span>
              <input value={val ?? ''} onChange={(e) => updateNodeProperty(node.id, p.key, e.target.value)} className={common} placeholder={p.placeholder} />
            </label>
          )
        })}
      </div>
      <div className="p-4 border-t border-white/10">
        <button onClick={() => deleteNode(node.id)} className="w-full px-3 py-2 rounded-md bg-red-600/20 text-red-300 hover:bg-red-600/30 text-sm">Delete Resource</button>
      </div>
    </aside>
  )
}
