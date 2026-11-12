import { useCallback, useEffect, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlowProvider,
  ConnectionMode,
  MarkerType,
  useReactFlow,
  type Connection,
  type EdgeTypes,
  type Node as RFNode,
  type NodeTypes,
  type OnConnectEnd,
  type Edge as RFEdge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Copy,
  LayoutGrid,
  Link2,
  MousePointer2,
  PanelLeft,
  Redo2,
  SlidersHorizontal,
  Sparkles,
  Undo2,
} from 'lucide-react'
import { useStore, type NodeData } from '../store/useStore'
import ResourceNode from './ResourceNode'
import InfraEdge from './InfraEdge'
import CustomConnectionLine from './CustomConnectionLine'
import { InkfraLogo, ProviderLogo } from './BrandLogos'
import catalog from '../data/catalog'
import { EDGE_KINDS } from '../types/ir'

const nodeTypes: NodeTypes = { resource: ResourceNode }
const edgeTypes: EdgeTypes = { infra: InfraEdge, smoothstep: InfraEdge }

const FEATURED_LOGOS = ['aws', 'azure', 'gcp', 'kubernetes', 'docker', 'terraform'] as const

type HandleSide = 'top' | 'right' | 'bottom' | 'left'

function getNodeCenter(node: RFNode<NodeData>) {
  const w = node.measured?.width ?? 220
  const h = node.measured?.height ?? 88
  return { x: node.position.x + w / 2, y: node.position.y + h / 2, w, h }
}

function getClosestHandleSide(node: RFNode<NodeData>, point: { x: number; y: number }): HandleSide {
  const { x: cx, y: cy, w, h } = getNodeCenter(node)
  const dx = (point.x - cx) / Math.max(w / 2, 1)
  const dy = (point.y - cy) / Math.max(h / 2, 1)
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx >= 0 ? 'right' : 'left'
  }
  return dy >= 0 ? 'bottom' : 'top'
}

interface CanvasProps {
  onOpenExamples: () => void
  onOpenSidebar: () => void
  onOpenProperties: () => void
}

function CanvasInner({ onOpenExamples, onOpenSidebar, onOpenProperties }: CanvasProps) {
  const nodes = useStore((s) => s.nodes)
  const edgesRaw = useStore((s) => s.edges)
  const selectedNodeId = useStore((s) => s.selectedNodeId)
  const selectedEdgeId = useStore((s) => s.selectedEdgeId)
  const fitViewSignal = useStore((s) => s.fitViewSignal)
  const focusNodeId = useStore((s) => s.focusNodeId)
  const focusSignal = useStore((s) => s.focusSignal)
  const connectMode = useStore((s) => s.connectMode)
  const setConnectMode = useStore((s) => s.setConnectMode)
  const toggleConnectMode = useStore((s) => s.toggleConnectMode)
  const canUndo = useStore((s) => s.canUndo)
  const canRedo = useStore((s) => s.canRedo)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const duplicateSelected = useStore((s) => s.duplicateSelected)
  const autoLayout = useStore((s) => s.autoLayout)
  const recordHistorySnapshot = useStore((s) => s.recordHistorySnapshot)
  const onNodesChange = useStore((s) => s.onNodesChange)
  const onEdgesChange = useStore((s) => s.onEdgesChange)
  const storeOnConnect = useStore((s) => s.onConnect)
  const onReconnect = useStore((s) => s.onReconnect)
  const setSelectedNode = useStore((s) => s.setSelectedNode)
  const setSelectedEdge = useStore((s) => s.setSelectedEdge)
  const addNode = useStore((s) => s.addNode)
  const { screenToFlowPosition, fitView } = useReactFlow()

  useEffect(() => {
    if (!fitViewSignal) return
    const timeout = window.setTimeout(() => {
      void fitView({ padding: 0.18, duration: 450 })
    }, 80)
    return () => window.clearTimeout(timeout)
  }, [fitViewSignal, fitView])

  useEffect(() => {
    if (!focusSignal || !focusNodeId) return
    const timeout = window.setTimeout(() => {
      void fitView({ nodes: [{ id: focusNodeId }], padding: 0.65, duration: 400, maxZoom: 1.2 })
    }, 60)
    return () => window.clearTimeout(timeout)
  }, [focusSignal, focusNodeId, fitView])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const mod = e.ctrlKey || e.metaKey
      if (mod) {
        const key = e.key.toLowerCase()
        if (key === 'z' && !e.shiftKey) {
          e.preventDefault()
          undo()
        } else if ((key === 'z' && e.shiftKey) || key === 'y') {
          e.preventDefault()
          redo()
        } else if (key === 'd') {
          e.preventDefault()
          duplicateSelected()
        }
        return
      }
      if (e.altKey) return
      if (e.key === 'c' || e.key === 'C') {
        toggleConnectMode()
      } else if (e.key === 'v' || e.key === 'V' || e.key === 'Escape') {
        setConnectMode(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggleConnectMode, setConnectMode, undo, redo, duplicateSelected])

  const normalizeConnection = useCallback(
    (conn: Connection): Connection => {
      const src = nodes.find((n) => n.id === conn.source)
      const tgt = nodes.find((n) => n.id === conn.target)
      let sourceHandle = conn.sourceHandle
      let targetHandle = conn.targetHandle

      if (src && tgt) {
        const srcCenter = getNodeCenter(src)
        const tgtCenter = getNodeCenter(tgt)
        if (!sourceHandle || sourceHandle === 'body') {
          sourceHandle = getClosestHandleSide(src, tgtCenter)
        }
        if (!targetHandle || targetHandle === 'body') {
          targetHandle = getClosestHandleSide(tgt, srcCenter)
        }
      }
      return { ...conn, sourceHandle, targetHandle }
    },
    [nodes],
  )

  const handleConnect = useCallback(
    (conn: Connection) => {
      storeOnConnect(normalizeConnection(conn))
    },
    [storeOnConnect, normalizeConnection],
  )

  const handleReconnect = useCallback(
    (oldEdge: RFEdge, newConn: Connection) => {
      onReconnect(oldEdge, normalizeConnection(newConn))
    },
    [onReconnect, normalizeConnection],
  )

  // Allow dropping a connector onto any target resource's body (not only its handle dots)
  const handleConnectEnd: OnConnectEnd = useCallback(
    (event, connectionState) => {
      if (connectionState.isValid || !connectionState.fromNode) return
      const clientX = 'changedTouches' in event ? event.changedTouches[0]?.clientX : event.clientX
      const clientY = 'changedTouches' in event ? event.changedTouches[0]?.clientY : event.clientY
      if (clientX == null || clientY == null) return

      const targetEl = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>('.react-flow__node')
      const targetId = targetEl?.dataset.id
      if (!targetId || targetId === connectionState.fromNode.id) return

      const sourceNode = nodes.find((n) => n.id === connectionState.fromNode?.id)
      const targetNode = nodes.find((n) => n.id === targetId)
      if (!sourceNode || !targetNode) return

      const dropPos = screenToFlowPosition({ x: clientX, y: clientY })
      const targetHandle = getClosestHandleSide(targetNode, dropPos)
      const rawSourceHandle = connectionState.fromHandle?.id
      const sourceHandle =
        !rawSourceHandle || rawSourceHandle === 'body'
          ? getClosestHandleSide(sourceNode, getNodeCenter(targetNode))
          : rawSourceHandle

      storeOnConnect({
        source: sourceNode.id,
        sourceHandle,
        target: targetNode.id,
        targetHandle,
      })
    },
    [nodes, screenToFlowPosition, storeOnConnect],
  )

  const edges: RFEdge[] = useMemo(
    () =>
      edgesRaw.map((e) => {
        const kind = (e.data?.kind as string) ?? 'connects'
        const k = EDGE_KINDS.find((item) => item.value === kind)
        const color = k?.color ?? '#34d399'
        return {
          ...e,
          sourceHandle: e.sourceHandle ?? 'right',
          targetHandle: e.targetHandle ?? 'left',
          type: 'infra',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color,
            width: 15,
            height: 15,
          },
          label: e.label ?? kind,
        }
      }),
    [edgesRaw],
  )

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId), [nodes, selectedNodeId])
  const selectedEdge = useMemo(() => edgesRaw.find((e) => e.id === selectedEdgeId), [edgesRaw, selectedEdgeId])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const type = e.dataTransfer.getData('application/inkfra-resource')
      if (!type) return
      const def = catalog.find((c) => c.type === type)
      if (!def) return
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      addNode(def, position)
    },
    [addNode, screenToFlowPosition],
  )

  const handleBrowseLibrary = () => {
    onOpenSidebar()
    window.setTimeout(() => {
      document.querySelector<HTMLInputElement>('[data-resource-search]')?.focus()
    }, 120)
  }

  return (
    <div className="relative h-full w-full" onDragOver={onDragOver} onDrop={onDrop}>
      <AnimatePresence>
        {nodes.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto relative w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]/95 p-6 text-center shadow-[var(--shadow)] backdrop-blur-md sm:p-8"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 left-1/2 h-44 w-72 -translate-x-1/2 rounded-full bg-blue-500/15 blur-3xl"
              />

              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-blue-500/20 via-indigo-500/15 to-violet-500/20 shadow-lg shadow-blue-500/15"
              >
                <InkfraLogo size={30} />
              </motion.div>

              <h2 className="mt-4 text-lg font-semibold tracking-tight sm:text-xl">
                Design infrastructure visually
              </h2>
              <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-[var(--text-muted)] sm:text-sm">
                Drag resources from the library or start with a blueprint. Connect any point or drop directly onto a
                resource to wire Terraform.
              </p>

              {/* Supported platform logos */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {FEATURED_LOGOS.map((p) => (
                  <div
                    key={p}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/90 shadow-inner transition-transform duration-150 hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
                    title={p.toUpperCase()}
                  >
                    <ProviderLogo provider={p} size={17} />
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                <button type="button" onClick={onOpenExamples} className="btn btn-primary">
                  <Sparkles size={15} />
                  Browse examples
                </button>
                <button type="button" onClick={handleBrowseLibrary} className="btn btn-secondary">
                  <PanelLeft size={15} />
                  Browse library
                </button>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
                <span className="chip">100+ cloud resources</span>
                <span className="chip">Any-point connectors</span>
                <span className="chip">Terraform .tf export</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        connectionRadius={28}
        connectionLineComponent={CustomConnectionLine}
        isValidConnection={(c) => c.source !== c.target}
        nodesDraggable={!connectMode}
        edgesReconnectable
        onNodesChange={onNodesChange}
        onNodeDragStart={() => recordHistorySnapshot()}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onConnectEnd={handleConnectEnd}
        onReconnect={handleReconnect}
        onNodeClick={(_, n) => setSelectedNode(n.id)}
        onEdgeClick={(_, e) => setSelectedEdge(e.id)}
        onPaneClick={() => {
          setSelectedNode(null)
          setSelectedEdge(null)
        }}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        defaultEdgeOptions={{ type: 'infra' }}
      >
        <Background gap={20} size={1.2} color="rgba(148, 163, 184, 0.14)" />
        <Controls showInteractive={false} className="!mb-14 sm:!mb-3" />
        {nodes.length > 0 && (
          <MiniMap
            pannable
            zoomable
            className="hidden !border !border-[var(--border)] !bg-[var(--surface)] sm:block"
            style={{ width: 164, height: 112 }}
            nodeColor={(n) => {
              const data = n.data as NodeData
              const def = catalog.find((c) => c.type === data.resourceType)
              return def?.color ?? '#475569'
            }}
            maskColor="rgba(2, 6, 23, 0.72)"
          />
        )}

        {/* Move vs Connect tool switcher */}
        {nodes.length > 0 && (
          <Panel position="top-left" className="!m-2.5 sm:!m-3">
            <div className="glass-panel flex items-center gap-1 rounded-xl border border-[var(--border)] p-1 shadow-[var(--shadow-sm)]">
              <button
                type="button"
                onClick={() => setConnectMode(false)}
                className={`inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition-all ${
                  !connectMode
                    ? 'bg-[var(--surface-3)] text-[var(--text)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
                title="Move & select resources (V)"
              >
                <MousePointer2 size={12} />
                <span>Move</span>
              </button>
              <button
                type="button"
                onClick={() => setConnectMode(true)}
                className={`inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition-all ${
                  connectMode
                    ? 'bg-blue-500/20 text-blue-200 ring-1 ring-inset ring-blue-400/40 shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
                title="Drag directly from any resource body to connect (C)"
              >
                <Link2 size={12} />
                <span>Connect</span>
              </button>
              <div className="mx-0.5 h-4 w-px bg-[var(--border)]" />
              <button
                type="button"
                onClick={undo}
                disabled={!canUndo}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-white/[0.06] hover:text-[var(--text)] disabled:pointer-events-none disabled:opacity-35"
                title="Undo (Ctrl+Z)"
                aria-label="Undo"
              >
                <Undo2 size={13} />
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={!canRedo}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-white/[0.06] hover:text-[var(--text)] disabled:pointer-events-none disabled:opacity-35"
                title="Redo (Ctrl+Shift+Z)"
                aria-label="Redo"
              >
                <Redo2 size={13} />
              </button>
              <button
                type="button"
                onClick={duplicateSelected}
                disabled={!selectedNodeId}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-white/[0.06] hover:text-[var(--text)] disabled:pointer-events-none disabled:opacity-35"
                title="Duplicate selected resource (Ctrl+D)"
                aria-label="Duplicate selected resource"
              >
                <Copy size={13} />
              </button>
              <button
                type="button"
                onClick={autoLayout}
                className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2 text-[11px] font-medium text-[var(--text-muted)] transition-colors hover:bg-white/[0.06] hover:text-[var(--text)]"
                title="Auto-arrange resources by architecture tier"
                aria-label="Auto layout"
              >
                <LayoutGrid size={12} />
                <span className="hidden sm:inline">Layout</span>
              </button>
            </div>
          </Panel>
        )}

        <Panel position="bottom-left" className="!m-2.5 sm:!m-3">
          <div className="glass-panel flex items-center gap-2.5 rounded-xl border border-[var(--border)] px-3 py-1.5 text-[11px] text-[var(--text-muted)] shadow-[var(--shadow-sm)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="font-medium text-[var(--text)]">{nodes.length}</span>
            <span className="-ml-1.5">resources</span>
            <span className="text-[var(--border-strong)]">·</span>
            <span className="font-medium text-[var(--text)]">{edges.length}</span>
            <span className="-ml-1.5">connectors</span>
            {connectMode && (
              <>
                <span className="hidden text-[var(--border-strong)] sm:inline">·</span>
                <span className="hidden font-medium text-blue-300 sm:inline">
                  Drag between resource bodies to connect
                </span>
              </>
            )}
          </div>
        </Panel>
      </ReactFlow>

      {/* Mobile / tablet quick-inspect pill when a node or edge is selected */}
      <AnimatePresence>
        {(selectedNode || selectedEdge) && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 lg:hidden"
          >
            <button
              type="button"
              onClick={onOpenProperties}
              className="btn btn-primary pointer-events-auto rounded-full px-4 shadow-xl"
            >
              <SlidersHorizontal size={14} />
              <span className="max-w-[160px] truncate">
                Edit {selectedNode ? selectedNode.data.label : 'connection'}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Canvas({ onOpenExamples, onOpenSidebar, onOpenProperties }: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner
        onOpenExamples={onOpenExamples}
        onOpenSidebar={onOpenSidebar}
        onOpenProperties={onOpenProperties}
      />
    </ReactFlowProvider>
  )
}
