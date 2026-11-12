import type { Project } from '../types/ir'
import catalog from '../data/catalog'
import { DEVOPS_ARTIFACT_TYPES } from './devops'

export interface ValidationIssue {
  level: 'error' | 'warning' | 'info'
  message: string
  nodeId?: string
}

const META_TF_TYPES = new Set([
  'tf_provider',
  'tf_backend',
  'tf_variable',
  'tf_output',
  'tf_module_call',
  'devops_terraform_module',
])

const CIDR_KEYS = new Set(['cidr_block', 'address_space', 'ip_cidr_range'])
const PORT_KEYS = new Set(['port', 'target_port', 'ports_internal', 'ports_external'])

function isValidCidr(value: string): boolean {
  const parts = value.split(',').map((s) => s.trim()).filter(Boolean)
  if (parts.length === 0) return true
  const ipv4Cidr = /^(\d{1,3}\.){3}\d{1,3}\/(\d{1,2})$/
  return parts.every((cidr) => {
    const m = cidr.match(ipv4Cidr)
    if (!m) return false
    const prefix = Number(m[2])
    if (prefix < 0 || prefix > 32) return false
    const octets = cidr.split('/')[0].split('.').map(Number)
    return octets.every((o) => o >= 0 && o <= 255)
  })
}

export function validateProject(project: Project): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (project.nodes.length === 0) {
    issues.push({ level: 'warning', message: 'Canvas is empty. Add resources to generate code.' })
    return issues
  }

  const ids = new Set(project.nodes.map((n) => n.id))

  for (const n of project.nodes) {
    const def = catalog.find((c) => c.type === n.type)
    if (!def) issues.push({ level: 'error', message: `Unknown resource type: ${n.type}`, nodeId: n.id })
    if (!n.label?.trim()) issues.push({ level: 'warning', message: 'Resource has empty label', nodeId: n.id })

    for (const p of def?.properties ?? []) {
      const val = n.properties?.[p.key]
      if (p.required && (val === undefined || val === '')) {
        issues.push({ level: 'error', message: `${n.label}: missing required "${p.label}"`, nodeId: n.id })
      }
      if (CIDR_KEYS.has(p.key) && typeof val === 'string' && val.trim() !== '' && !isValidCidr(val)) {
        issues.push({ level: 'error', message: `${n.label}: invalid CIDR "${val}" in ${p.label}`, nodeId: n.id })
      }
      if (PORT_KEYS.has(p.key) && val !== undefined && val !== '') {
        const numVal = Number(val)
        if (!Number.isInteger(numVal) || numVal < 1 || numVal > 65535) {
          issues.push({ level: 'error', message: `${n.label}: port must be between 1 and 65535`, nodeId: n.id })
        }
      }
    }

    if (
      def &&
      !def.terraformType &&
      def.provider !== 'generic' &&
      !META_TF_TYPES.has(def.type) &&
      !DEVOPS_ARTIFACT_TYPES.has(def.type)
    ) {
      issues.push({ level: 'warning', message: `${n.label}: no Terraform mapping; will be skipped`, nodeId: n.id })
    }

    // Security posture hints
    if (n.type === 'aws_s3_bucket' && n.properties?.acl === 'public-read') {
      issues.push({ level: 'warning', message: `${n.label}: S3 bucket ACL is public-read; prefer private.`, nodeId: n.id })
    }
    if (n.type === 'aws_security_group' && typeof n.properties?.ingress === 'string') {
      const ing = n.properties.ingress
      if (/(^|[\n,;])\s*tcp\s+22\s+0\.0\.0\.0\/0/i.test(ing)) {
        issues.push({
          level: 'warning',
          message: `${n.label}: SSH port 22 is open to 0.0.0.0/0; restrict CIDR range.`,
          nodeId: n.id,
        })
      }
      if (/(^|[\n,;])\s*tcp\s+(3389|5432|3306|6379|27017)\s+0\.0\.0\.0\/0/i.test(ing)) {
        issues.push({
          level: 'warning',
          message: `${n.label}: sensitive database/admin port exposed to 0.0.0.0/0.`,
          nodeId: n.id,
        })
      }
    }
    if (n.type === 'aws_lb_listener' && String(n.properties?.protocol || '').toUpperCase() === 'HTTP') {
      issues.push({
        level: 'warning',
        message: `${n.label}: plain HTTP listener; prefer HTTPS or redirect HTTP -> HTTPS.`,
        nodeId: n.id,
      })
    }
    if (
      (n.type === 'aws_rds_instance' || n.type === 'azurerm_sql_server') &&
      typeof n.properties?.password === 'string' &&
      n.properties.password.trim() !== ''
    ) {
      issues.push({
        level: 'warning',
        message: `${n.label}: plaintext password cleared from HCL and replaced with sensitive variable.`,
        nodeId: n.id,
      })
    }
    if (n.type === 'aws_iam_policy' && typeof n.properties?.policy === 'string') {
      if (/"Action"\s*:\s*"\*"/.test(n.properties.policy) && /"Resource"\s*:\s*"\*"/.test(n.properties.policy)) {
        issues.push({
          level: 'warning',
          message: `${n.label}: IAM policy grants wildcard Action/Resource (*); scope to least privilege.`,
          nodeId: n.id,
        })
      }
    }
  }

  for (const e of project.edges) {
    if (!ids.has(e.source) || !ids.has(e.target)) {
      issues.push({ level: 'error', message: `Dangling connection ${e.id}` })
    }
    if (e.source === e.target) {
      issues.push({ level: 'error', message: 'Self-loop connection is not allowed', nodeId: e.source })
    }
  }

  // Duplicate labels within same type
  const seen = new Map<string, number>()
  for (const n of project.nodes) {
    const key = `${n.type}::${n.label}`
    seen.set(key, (seen.get(key) ?? 0) + 1)
  }
  for (const [k, v] of seen) {
    if (v > 1) issues.push({ level: 'warning', message: `Duplicate resource label: ${k.split('::')[1]}` })
  }

  // Provider consistency
  const cloudProviders = new Set(
    project.nodes
      .map((n) => catalog.find((c) => c.type === n.type)?.provider)
      .filter((p) => p === 'aws' || p === 'azure' || p === 'gcp'),
  )
  if (cloudProviders.size > 1 && project.provider !== 'multi') {
    issues.push({ level: 'info', message: 'Multiple cloud providers detected. Consider setting target to "multi".' })
  }

  // Required parent checks across AWS, Azure, and GCP networking resources
  const needsParent: Record<string, string> = {
    aws_subnet: 'aws_vpc',
    aws_route_table: 'aws_vpc',
    aws_internet_gateway: 'aws_vpc',
    aws_security_group: 'aws_vpc',
    aws_lb_target_group: 'aws_vpc',
    aws_nat_gateway: 'aws_subnet',
    azurerm_subnet: 'azurerm_virtual_network',
    google_compute_subnetwork: 'google_compute_network',
  }
  for (const n of project.nodes) {
    const parentType = needsParent[n.type]
    if (!parentType) continue
    const hasParent = project.edges.some((e) => {
      if (e.source !== n.id && e.target !== n.id) return false
      const otherId = e.source === n.id ? e.target : e.source
      const t = project.nodes.find((x) => x.id === otherId)
      return t?.type === parentType
    })
    if (!hasParent) {
      const label = catalog.find((c) => c.type === n.type)?.label ?? n.type
      const parentLabel = catalog.find((c) => c.type === parentType)?.label ?? parentType
      issues.push({
        level: 'error',
        message: `${n.label || label}: requires a connected ${parentLabel}.`,
        nodeId: n.id,
      })
    }
  }

  // AWS ALB multi-subnet hint
  for (const n of project.nodes) {
    if (n.type !== 'aws_lb') continue
    const subnetEdges = project.edges.filter((e) => {
      if (e.source !== n.id && e.target !== n.id) return false
      const otherId = e.source === n.id ? e.target : e.source
      return project.nodes.find((x) => x.id === otherId)?.type === 'aws_subnet'
    })
    if (subnetEdges.length === 1) {
      issues.push({
        level: 'warning',
        message: `${n.label}: AWS Load Balancers typically require at least 2 subnets across different AZs.`,
        nodeId: n.id,
      })
    }
  }

  // Connectivity hint
  const isolated = project.nodes.filter((n) => !project.edges.some((e) => e.source === n.id || e.target === n.id))
  if (isolated.length > 0 && project.nodes.length > 1) {
    issues.push({ level: 'info', message: `${isolated.length} resource(s) have no connections.` })
  }

  if (issues.length === 0) issues.push({ level: 'info', message: 'No issues found. Ready to generate.' })
  return issues
}
