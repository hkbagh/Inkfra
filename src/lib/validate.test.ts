import { describe, it, expect } from 'vitest'
import { validateProject } from './validate'
import type { Project } from '../types/ir'

describe('validateProject', () => {
  it('warns on empty canvas', () => {
    const p: Project = { name: 'x', provider: 'aws', nodes: [], edges: [], createdAt: '', updatedAt: '' }
    const issues = validateProject(p)
    expect(issues.some((i) => i.level === 'warning')).toBe(true)
  })
  it('errors on dangling edge', () => {
    const p: Project = {
      name: 'x', provider: 'aws',
      nodes: [{ id: 'a', type: 'aws_vpc', label: 'VPC', provider: 'aws', x: 0, y: 0, properties: {} }],
      edges: [{ id: 'e', source: 'a', target: 'missing', kind: 'contains' }],
      createdAt: '', updatedAt: '',
    }
    const issues = validateProject(p)
    expect(issues.some((i) => i.level === 'error')).toBe(true)
  })
})
