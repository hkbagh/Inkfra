import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
  type Edge as RFEdge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useStore } from '../store/useStore'
import ResourceNode from './ResourceNode'
import catalog from '../data/catalog'
import { EDGE_KINDS } from '../types/ir'

const nodeTypes: NodeTypes = { resource: ResourceNode }

function edgeStyle(kind?: string) {
  const k = EDGE_KINDS.find((e) => e.value === kind)
  const color = k?.color ?? '#64748b'
  let dash = '0'
  if (k?.style === 'dashed') dash = '6 4'
  if (k?.style === 'dotted') dash = '2 4'
  return { stroke: color, strokeWidth: 2, strokeDasharray: dash }
}

function CanvasInner() {
  const nodes = useStore((s) => s.nodes)
  const edgesRaw = useStore((s) => s.edges)
  const onNodesChange = useStore((s) => s.onNodesChange)
  const onEdgesChange = useStore((s) => s.onEdgesChange)
  const onConnect = useStore((s) => s.onConnect)
  const setSelectedNode = useStore((s) => s.setSelectedNode)
  const setSelectedEdge = useStore((s) => s.setSelectedEdge)
  const addNode = useStore((s) => s.addNode)
  const { screenToFlowPosition } = useReactFlow()

  const edges: RFEdge[] = useMemo(() => edgesRaw.map((e) => ({
    ...e,
    style: edgeStyle(e.data?.kind as string),
    animated: e.data?.kind === 'traffic',
    label: e.label ?? (e.data?.kind as string),
    labelStyle: { fill: '#cbd5e1', fontSize: 11 },
    labelBgStyle: { fill: '#0f172a', fillOpacity: 0.8 },
  })), [edgesRaw])

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

  return (
    <div className="w-full h-full relative" onDragOver={onDragOver} onDrop={onDrop}>
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center text-slate-500">
            <div className="text-lg font-medium mb-1">Drag resources here</div>
            <div className="text-sm">or click an item in the library to add it</div>
          </div>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, n: any) => setSelectedNode(n.id)}
        onEdgeClick={(_, e: any) => setSelectedEdge(e.id)}
        onPaneClick={() => {
          setSelectedNode(null)
          setSelectedEdge(null)
        }}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} color="#1e293b" />
        <Controls className="!bg-slate-800 !border-white/10 !text-white" />
        <MiniMap className="!bg-slate-900" nodeColor={() => '#475569'} maskColor="rgba(0,0,0,0.6)" />
      </ReactFlow>
    </div>
  )
}

export default function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  )
}
