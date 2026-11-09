import type { Project } from '../types/ir'
import catalog from '../data/catalog'

export interface ValidationIssue {
  level: 'error' | 'warning' | 'info'
  message: string
  nodeId?: string
}

export function validateProject(project: Project): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (project.nodes.length === 0) {
    issues.push({ level: 'warning', message: 'Canvas is empty. Add resources to generate code.' })
    return issues
  }

  const ids = new Set(project.nodes.map((n) => n.id))
  // missing defs
  for (const n of project.nodes) {
    const def = catalog.find((c) => c.type === n.type)
    if (!def) issues.push({ level: 'error', message: `Unknown resource type: ${n.type}`, nodeId: n.id })
    if (!n.label?.trim()) issues.push({ level: 'warning', message: 'Resource has empty label', nodeId: n.id })
    // required props
    for (const p of def?.properties ?? []) {
      if (p.required && (n.properties?.[p.key] === undefined || n.properties?.[p.key] === '')) {
        issues.push({ level: 'error', message: `${n.label}: missing required "${p.label}"`, nodeId: n.id })
      }
    }
    // terraform mapping
    if (def && !def.terraformType && def.provider !== 'generic') {
      issues.push({ level: 'warning', message: `${n.label}: no Terraform mapping; will be skipped`, nodeId: n.id })
    }
  }

  // edges
  for (const e of project.edges) {
    if (!ids.has(e.source) || !ids.has(e.target)) {
      issues.push({ level: 'error', message: `Dangling connection ${e.id}` })
    }
    if (e.source === e.target) {
      issues.push({ level: 'error', message: 'Self-loop connection is not allowed', nodeId: e.source })
    }
  }

  // duplicate labels within same type
  const seen = new Map<string, number>()
  for (const n of project.nodes) {
    const key = `${n.type}::${n.label}`
    seen.set(key, (seen.get(key) ?? 0) + 1)
  }
  for (const [k, v] of seen) {
    if (v > 1) issues.push({ level: 'warning', message: `Duplicate resource label: ${k.split('::')[1]}` })
  }

  // provider consistency (only cloud providers matter)
  const cloudProviders = new Set(project.nodes.map((n) => {
    const d = catalog.find((c) => c.type === n.type)
    return d?.provider
  }).filter((p) => p === 'aws' || p === 'azure' || p === 'gcp'))
  if (cloudProviders.size > 1 && project.provider !== 'multi') {
    issues.push({ level: 'info', message: 'Multiple cloud providers detected. Consider setting target to "multi".' })
  }

  // required parent checks for AWS resources that need a container
  const needsParent: Record<string, string> = {
    aws_subnet: 'aws_vpc',
    aws_route_table: 'aws_vpc',
    aws_internet_gateway: 'aws_vpc',
    aws_security_group: 'aws_vpc',
    aws_lb_target_group: 'aws_vpc',
    aws_nat_gateway: 'aws_subnet',
  }
  for (const n of project.nodes) {
    const parentType = needsParent[n.type]
    if (!parentType) continue
    const hasParent = project.edges.some((e) => {
      if (e.source !== n.id) return false
      const t = project.nodes.find((x) => x.id === e.target)
      return t?.type === parentType
    })
    if (!hasParent) {
      const label = catalog.find((c) => c.type === n.type)?.label ?? n.type
      issues.push({ level: 'error', message: `${n.label || label}: requires a connected ${parentType.replace('aws_', '').toUpperCase()}.`, nodeId: n.id })
    }
  }

  // connectivity hint
  const isolated = project.nodes.filter((n) => !project.edges.some((e) => e.source === n.id || e.target === n.id))
  if (isolated.length > 0 && project.nodes.length > 1) {
    issues.push({ level: 'info', message: `${isolated.length} resource(s) have no connections.` })
  }

  if (issues.length === 0) issues.push({ level: 'info', message: 'No issues found. Ready to generate.' })
  return issues
}
