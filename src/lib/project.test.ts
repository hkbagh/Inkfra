import { describe, it, expect } from 'vitest'
import { parseProject } from './project'

describe('parseProject', () => {
  it('parses valid project', () => {
    const p = parseProject({ name: 'demo', nodes: [{ id: 'n1', type: 'aws_vpc', label: 'VPC', x: 0, y: 0, properties: {} }], edges: [] })
    expect(p?.name).toBe('demo')
    expect(p?.nodes.length).toBe(1)
  })
  it('preserves connector sourceHandle and targetHandle', () => {
    const p = parseProject({
      name: 'handles',
      nodes: [
        { id: 'n1', type: 'aws_vpc', label: 'VPC', x: 0, y: 0, properties: {} },
        { id: 'n2', type: 'aws_subnet', label: 'Subnet', x: 100, y: 100, properties: {} },
      ],
      edges: [
        {
          id: 'e1',
          source: 'n2',
          target: 'n1',
          sourceHandle: 'top',
          targetHandle: 'top',
          kind: 'contains',
        },
      ],
    })
    expect(p?.edges[0]?.sourceHandle).toBe('top')
    expect(p?.edges[0]?.targetHandle).toBe('top')
  })
  it('rejects invalid input', () => {
    expect(parseProject(null)).toBeNull()
    expect(parseProject({})).toBeNull()
  })
})
