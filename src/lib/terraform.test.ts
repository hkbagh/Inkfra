import { describe, it, expect } from 'vitest'
import { generateTerraform } from './terraform'
import type { Project } from '../types/ir'

describe('generateTerraform', () => {
  it('generates a VPC resource', () => {
    const p: Project = {
      name: 'demo', provider: 'aws',
      nodes: [{ id: 'vpc1', type: 'aws_vpc', label: 'VPC', provider: 'aws', x: 0, y: 0, properties: { cidr_block: '10.0.0.0/16', name: 'vpc' } }],
      edges: [],
      createdAt: '', updatedAt: '',
    }
    const r = generateTerraform(p)
    expect(r.files['main.tf']).toContain('resource "aws_vpc"')
    expect(r.warnings).toEqual([])
  })
})
