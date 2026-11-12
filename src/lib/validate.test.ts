import { describe, expect, it } from 'vitest'
import { validateProject } from './validate'
import type { Project } from '../types/ir'

function makeProject(partial: Partial<Project> = {}): Project {
  return {
    name: 'val-test',
    provider: 'aws',
    nodes: [],
    edges: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  }
}

describe('validateProject', () => {
  it('warns when the canvas is empty and flags invalid CIDR and port values', () => {
    expect(validateProject(makeProject()).some((i) => i.level === 'warning')).toBe(true)

    const issues = validateProject(
      makeProject({
        nodes: [
          {
            id: 'vpc1',
            type: 'aws_vpc',
            label: 'bad-vpc',
            provider: 'aws',
            x: 0,
            y: 0,
            properties: { name: 'bad-vpc', cidr_block: '999.0.0.0/16' },
          },
          {
            id: 'tg1',
            type: 'aws_lb_target_group',
            label: 'bad-tg',
            provider: 'aws',
            x: 100,
            y: 0,
            properties: { name: 'bad-tg', port: 70000, protocol: 'HTTP' },
          },
          {
            id: 'azsub',
            type: 'azurerm_subnet',
            label: 'orphan-az-subnet',
            provider: 'azure',
            x: 200,
            y: 0,
            properties: { name: 'orphan', address_prefixes: '10.1.0.0/24' },
          },
        ],
        edges: [{ id: 'e1', source: 'tg1', target: 'vpc1', kind: 'contains' }],
      }),
    )

    expect(issues.some((i) => i.level === 'error' && i.nodeId === 'vpc1' && i.message.includes('CIDR'))).toBe(true)
    expect(issues.some((i) => i.level === 'error' && i.nodeId === 'tg1' && i.message.toLowerCase().includes('port'))).toBe(true)
    expect(issues.some((i) => i.level === 'error' && i.nodeId === 'azsub' && i.message.includes('Virtual Network'))).toBe(true)
  })

  it('accepts parent connections in either direction, recognizes DevOps nodes, and warns on security issues', () => {
    const issues = validateProject(
      makeProject({
        nodes: [
          {
            id: 'vpc1',
            type: 'aws_vpc',
            label: 'vpc',
            provider: 'aws',
            x: 0,
            y: 0,
            properties: { name: 'vpc', cidr_block: '10.0.0.0/16' },
          },
          {
            id: 'sub1',
            type: 'aws_subnet',
            label: 'sub',
            provider: 'aws',
            x: 100,
            y: 0,
            properties: { name: 'sub', cidr_block: '10.0.1.0/24' },
          },
          {
            id: 'sg1',
            type: 'aws_security_group',
            label: 'open-db-ssh',
            provider: 'aws',
            x: 200,
            y: 0,
            properties: { name: 'open-db-ssh', ingress: 'tcp 22 0.0.0.0/0, tcp 5432 0.0.0.0/0' },
          },
          {
            id: 's3',
            type: 'aws_s3_bucket',
            label: 'pub-bucket',
            provider: 'aws',
            x: 300,
            y: 0,
            properties: { bucket: 'my-pub-bucket', acl: 'public-read' },
          },
          {
            id: 'alb',
            type: 'aws_lb',
            label: 'single-az-alb',
            provider: 'aws',
            x: 400,
            y: 0,
            properties: { name: 'single-az-alb', load_balancer_type: 'application' },
          },
          {
            id: 'lst',
            type: 'aws_lb_listener',
            label: 'http-lst',
            provider: 'aws',
            x: 450,
            y: 0,
            properties: { port: 80, protocol: 'HTTP' },
          },
          {
            id: 'gha',
            type: 'devops_github_actions',
            label: 'CI/CD',
            provider: 'devops',
            x: 500,
            y: 0,
            properties: { workflow: '.github/workflows/infra.yml' },
          },
        ],
        edges: [
          { id: 'e1', source: 'vpc1', target: 'sub1', kind: 'contains' },
          { id: 'e2', source: 'vpc1', target: 'sg1', kind: 'contains' },
          { id: 'e3', source: 'alb', target: 'sub1', kind: 'connects' },
          { id: 'e4', source: 'lst', target: 'alb', kind: 'contains' },
        ],
      }),
    )

    expect(issues.filter((i) => i.level === 'error')).toHaveLength(0)
    expect(issues.some((i) => i.level === 'warning' && i.nodeId === 'sg1' && i.message.includes('SSH'))).toBe(true)
    expect(issues.some((i) => i.level === 'warning' && i.nodeId === 'sg1' && i.message.includes('database/admin'))).toBe(true)
    expect(issues.some((i) => i.level === 'warning' && i.nodeId === 's3' && i.message.includes('public'))).toBe(true)
    expect(issues.some((i) => i.level === 'warning' && i.nodeId === 'alb' && i.message.includes('2 subnets'))).toBe(true)
    expect(issues.some((i) => i.level === 'warning' && i.nodeId === 'lst' && i.message.includes('HTTP'))).toBe(true)
    // DevOps artifact nodes should not produce bogus skip warnings
    expect(issues.some((i) => i.nodeId === 'gha' && i.message.includes('skipped'))).toBe(false)
  })
})
