import { memo, createElement } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { getIcon } from '../lib/iconMap'
import catalog from '../data/catalog'
import type { NodeData } from '../store/useStore'

function ResourceNode({ data, selected }: NodeProps & { data: NodeData }) {
  const def = catalog.find((c) => c.type === data.resourceType)
  const iconComp = (def && getIcon(def.icon)) || getIcon('Box')
  const color = def?.color ?? '#64748b'
  return (
    <div
      className={`min-w-[180px] rounded-xl border bg-slate-900/95 shadow-xl transition-all duration-150 ${
        selected ? 'border-blue-400/70 ring-2 ring-blue-400/20 scale-[1.01]' : 'border-white/10 hover:border-white/20'
      }`}
      style={{ borderColor: selected ? color : undefined }}
    >
      <div className="flex items-center gap-2 px-3 py-2 rounded-t-xl" style={{ background: `${color}22` }}>
        <div className="p-1.5 rounded-md" style={{ background: `${color}33`, color }}>
          {createElement(iconComp, { size: 16 })}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-slate-400">{def?.provider ?? data.provider}</div>
          <div className="text-sm font-medium truncate">{data.label}</div>
        </div>
      </div>
      <div className="px-3 py-1.5 text-[11px] text-slate-400 truncate">
        {def?.label ?? data.resourceType}
      </div>
      <Handle type="target" position={Position.Left} className="!bg-slate-400" aria-label="input" />
      <Handle type="source" position={Position.Right} className="!bg-slate-400" aria-label="output" />
      <Handle type="target" position={Position.Top} className="!bg-slate-400" aria-label="input" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" aria-label="output" />
    </div>
  )
}

export default memo(ResourceNode)
