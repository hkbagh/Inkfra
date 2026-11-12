import { useState } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react'
import { ArrowRight, Boxes, Clock, HardDrive, Link2, RefreshCw, Trash2, Zap } from 'lucide-react'
import { EDGE_KINDS, type EdgeKind } from '../types/ir'
import { useStore } from '../store/useStore'

function EdgeKindIcon({ kind, size = 11 }: { kind: string; size?: number }) {
  switch (kind) {
    case 'contains':
      return <Boxes size={size} />
    case 'depends_on':
      return <Clock size={size} />
    case 'traffic':
      return <Zap size={size} />
    case 'mounts':
      return <HardDrive size={size} />
    case 'routes_to':
      return <ArrowRight size={size} />
    default:
      return <Link2 size={size} />
  }
}

export default function InfraEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  label,
  selected,
  markerEnd,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false)
  const updateEdge = useStore((s) => s.updateEdge)
  const deleteEdge = useStore((s) => s.deleteEdge)
  const setSelectedEdge = useStore((s) => s.setSelectedEdge)

  const kind = (data?.kind as EdgeKind) ?? 'connects'
  const kindDef = EDGE_KINDS.find((k) => k.value === kind) ?? EDGE_KINDS[2]
  const color = kindDef.color
  const isTraffic = kind === 'traffic'

  let dashArray: string | undefined
  if (kindDef.style === 'dashed') dashArray = '7 5'
  else if (kindDef.style === 'dotted') dashArray = '2.5 5'
  else if (isTraffic) dashArray = '8 6'

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 14,
  })

  const active = Boolean(selected || hovered)

  const cycleKind = (e: React.MouseEvent) => {
    e.stopPropagation()
    const idx = EDGE_KINDS.findIndex((k) => k.value === kind)
    const next = EDGE_KINDS[(idx + 1) % EDGE_KINDS.length]
    updateEdge(id, { data: { kind: next.value }, label: next.value })
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteEdge(id)
  }

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="cursor-pointer"
    >
      {/* Ambient glow underlay on hover/selection */}
      {active && (
        <path
          d={edgePath}
          fill="none"
          stroke={color}
          strokeWidth={selected ? 8 : 6}
          strokeOpacity={selected ? 0.24 : 0.14}
          strokeLinecap="round"
          className="pointer-events-none transition-opacity duration-150"
        />
      )}

      {/* Subtle base track for traffic edges */}
      {isTraffic && (
        <path
          d={edgePath}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeOpacity={0.22}
          className="pointer-events-none"
        />
      )}

      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={24}
        className={isTraffic ? 'inkfra-edge-flow' : undefined}
        style={{
          stroke: color,
          strokeWidth: selected ? 2.6 : hovered ? 2.4 : 2,
          strokeDasharray: dashArray,
          strokeLinecap: 'round',
          transition: 'stroke-width 150ms ease, filter 150ms ease',
          filter: selected ? `drop-shadow(0 0 6px ${color}88)` : undefined,
        }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={(e) => {
            e.stopPropagation()
            setSelectedEdge(id)
          }}
          className="nodrag nopan"
        >
          <div
            className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium shadow-md backdrop-blur-md transition-all duration-150 ${
              selected
                ? 'scale-105 bg-[var(--surface-2)] text-[var(--text)] shadow-lg'
                : hovered
                  ? 'scale-[1.03] bg-[var(--surface)]/95 text-[var(--text)]'
                  : 'bg-[var(--surface)]/90 text-[var(--text-muted)]'
            }`}
            style={{
              borderColor: selected ? color : hovered ? `${color}88` : 'var(--border)',
              boxShadow: selected ? `0 0 0 2px ${color}25, 0 8px 20px rgba(0,0,0,0.45)` : undefined,
            }}
          >
            <span className="flex items-center" style={{ color }}>
              <EdgeKindIcon kind={kind} size={11} />
            </span>
            <span className="max-w-[110px] truncate">{typeof label === 'string' && label ? label : kindDef.label}</span>

            {selected && (
              <span className="ml-0.5 flex items-center gap-0.5 border-l border-white/10 pl-1">
                <button
                  type="button"
                  onClick={cycleKind}
                  title="Cycle connector kind"
                  aria-label="Cycle connector kind"
                  className="flex h-4 w-4 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-white/10 hover:text-[var(--text)]"
                >
                  <RefreshCw size={9} />
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  title="Delete connector"
                  aria-label="Delete connector"
                  className="flex h-4 w-4 items-center justify-center rounded-full text-red-300/80 transition-colors hover:bg-red-500/20 hover:text-red-200"
                >
                  <Trash2 size={9} />
                </button>
              </span>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </g>
  )
}

