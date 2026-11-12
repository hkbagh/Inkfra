import { getSmoothStepPath, type ConnectionLineComponentProps } from '@xyflow/react'

export default function CustomConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
}: ConnectionLineComponentProps) {
  const [path] = getSmoothStepPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
    borderRadius: 14,
  })

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke="#5b8cff"
        strokeWidth={6}
        strokeOpacity={0.18}
        strokeLinecap="round"
      />
      <path
        d={path}
        fill="none"
        stroke="#60a5fa"
        strokeWidth={2.2}
        strokeDasharray="6 5"
        strokeLinecap="round"
        className="inkfra-connection-line"
      />
      <circle cx={toX} cy={toY} r={5} fill="#5b8cff" fillOpacity={0.25} />
      <circle cx={toX} cy={toY} r={3} fill="#93c5fd" stroke="#0b1220" strokeWidth={1.5} />
    </g>
  )
}

