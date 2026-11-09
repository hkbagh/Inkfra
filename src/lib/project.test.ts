import { describe, it, expect } from 'vitest'
import { parseProject } from './project'

describe('parseProject', () => {
  it('parses valid project', () => {
    const p = parseProject({ name: 'demo', nodes: [{ id: 'n1', type: 'aws_vpc', label: 'VPC', x: 0, y: 0, properties: {} }], edges: [] })
    expect(p?.name).toBe('demo')
    expect(p?.nodes.length).toBe(1)
  })
  it('rejects invalid input', () => {
    expect(parseProject(null)).toBeNull()
    expect(parseProject({})).toBeNull()
  })
})
