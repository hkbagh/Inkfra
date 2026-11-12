import { memo, createElement, type CSSProperties } from 'react'
import { Handle, Position, useConnection, type NodeProps } from '@xyflow/react'
import { motion } from 'framer-motion'
import { getIcon } from '../lib/iconMap'
import { BRANDED_RESOURCE_TYPES } from '../lib/brandMeta'
import catalog from '../data/catalog'
import { useStore, type NodeData } from '../store/useStore'
import { ProviderLogo } from './BrandLogos'

function ResourceNode({ id, data, selected }: NodeProps & { data: NodeData }) {
  const connectMode = useStore((s) => s.connectMode)
  const isConnectionTarget = useConnection((c) => Boolean(c.inProgress && c.fromNode?.id !== id))

  const def = catalog.find((c) => c.type === data.resourceType)
  const iconComp = (def && getIcon(def.icon)) || getIcon('Box')
  const color = def?.color ?? '#64748b'
  const provider = def?.provider ?? data.provider
  const isBrandedTool = BRANDED_RESOURCE_TYPES.has(data.resourceType)

  const nodeStyle: CSSProperties & { '--node-color': string } = {
    '--node-color': color,
    ...(selected
      ? {
          borderColor: color,
          boxShadow: `0 0 0 3px ${color}28, 0 20px 44px rgba(0, 0, 0, 0.45)`,
        }
      : isConnectionTarget
        ? {
            boxShadow: '0 0 0 3px rgba(91, 140, 255, 0.22), 0 14px 30px rgba(0, 0, 0, 0.35)',
          }
        : {}),
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 4 }}
      animate={{ opacity: 1, scale: selected ? 1.015 : 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className={`inkfra-node group relative min-w-[205px] max-w-[250px] overflow-visible rounded-xl border bg-[var(--surface)]/95 shadow-[var(--shadow-sm)] backdrop-blur-sm transition-[border-color,box-shadow] duration-150 ${
        selected
          ? 'inkfra-node-selected border-transparent'
          : isConnectionTarget
            ? 'border-blue-400/70'
            : connectMode
              ? 'cursor-crosshair border-[var(--border)] hover:border-blue-400/60'
              : 'border-[var(--border)] hover:border-[var(--border-strong)]'
      }`}
      style={nodeStyle}
    >
      <div className="overflow-hidden rounded-[11px]">
        {/* Top subtle accent line */}
        <div
          className="h-[2px] w-full opacity-80"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}33)` }}
        />

        <div
          className="flex items-center gap-2.5 border-b border-white/[0.06] px-3 py-2.5"
          style={{ background: `linear-gradient(135deg, ${color}22, ${color}06)` }}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-150 group-hover:scale-105"
            style={{ background: `${color}24`, color, boxShadow: `inset 0 0 0 1px ${color}38` }}
          >
            {isBrandedTool ? (
              <ProviderLogo provider={provider} resourceType={data.resourceType} size={17} />
            ) : (
              createElement(iconComp, { size: 16 })
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
              <span className="truncate">{provider}</span>
            </div>
            <div className="truncate text-[13px] font-semibold leading-tight text-[var(--text)]">{data.label}</div>
          </div>

          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-[var(--surface-2)]/85 shadow-inner"
            title={provider.toUpperCase()}
          >
            <ProviderLogo provider={provider} size={13} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <span className="truncate text-[10px] font-medium text-[var(--text-muted)]">
            {def?.terraformType ?? def?.label ?? data.resourceType}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            {def?.container && (
              <span className="rounded bg-blue-500/12 px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-blue-300 ring-1 ring-inset ring-blue-400/25">
                Scope
              </span>
            )}
            <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--text-muted)] ring-1 ring-inset ring-white/[0.06]">
              {def?.category ?? 'resource'}
            </span>
          </div>
        </div>
      </div>

      {/* Full-body handle active in Connect Mode so users can drag directly from the resource body */}
      {connectMode && (
        <Handle
          id="body"
          type="source"
          position={Position.Right}
          className="!inset-0 !left-0 !top-0 !z-10 !h-full !w-full !transform-none !cursor-crosshair !rounded-xl !border-0 !bg-transparent !opacity-0 !shadow-none"
          aria-label="Connect from resource body"
        />
      )}

      {/* Bidirectional 4-side handles (Loose mode: every point can be source or target) */}
      <Handle id="top" type="source" position={Position.Top} className="node-handle !z-20" aria-label="Top connector" />
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="node-handle !z-20"
        aria-label="Right connector"
      />
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className="node-handle !z-20"
        aria-label="Bottom connector"
      />
      <Handle
        id="left"
        type="source"
        position={Position.Left}
        className="node-handle !z-20"
        aria-label="Left connector"
      />
    </motion.div>
  )
}

export default memo(ResourceNode)
