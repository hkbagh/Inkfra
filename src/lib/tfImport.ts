import catalog from '../data/catalog'
import type { EdgeKind, InfraEdge, InfraNode, Project, Provider } from '../types/ir'

export interface TfInputFile {
  name: string
  content: string
}

function stripHclComments(raw: string): string {
  return raw
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => {
      // Remove line comments outside quoted strings cleanly enough for practical HCL
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"' && line[i - 1] !== '\\') inQuotes = !inQuotes
        if (!inQuotes && (line[i] === '#' || (line[i] === '/' && line[i + 1] === '/'))) {
          return line.slice(0, i)
        }
      }
      return line
    })
    .join('\n')
}

interface ParsedBlock {
  header: string
  body: string
}

function extractTopLevelBlocks(hcl: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = []
  let i = 0
  const len = hcl.length

  while (i < len) {
    while (i < len && /\s/.test(hcl[i])) i++
    if (i >= len) break

    const start = i
    let inQuotes = false
    while (i < len) {
      const ch = hcl[i]
      if (ch === '"' && hcl[i - 1] !== '\\') inQuotes = !inQuotes
      if (!inQuotes && ch === '{') break
      i++
    }
    if (i >= len || hcl[i] !== '{') break

    const rawHeader = hcl.slice(start, i).trim()
    const headerLines = rawHeader.split('\n').map((l) => l.trim()).filter(Boolean)
    const header = headerLines[headerLines.length - 1] ?? ''
    i++ // skip '{'
    const bodyStart = i
    let depth = 1
    inQuotes = false
    while (i < len && depth > 0) {
      const ch = hcl[i]
      if (ch === '"' && hcl[i - 1] !== '\\') inQuotes = !inQuotes
      if (!inQuotes) {
        if (ch === '{') depth++
        else if (ch === '}') depth--
      }
      i++
    }
    const body = hcl.slice(bodyStart, Math.max(bodyStart, i - 1))
    blocks.push({ header, body })
  }

  return blocks
}

function extractScalarProps(body: string): Record<string, string | number | boolean> {
  const props: Record<string, string | number | boolean> = {}
  let depth = 0

  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    // Track nested blocks so only top-level scalar attributes are parsed as node properties
    for (const ch of line) {
      if (ch === '{') depth++
      else if (ch === '}') depth = Math.max(0, depth - 1)
    }
    if (depth !== 0) continue

    const m = line.match(/^([a-zA-Z0-9_]+)\s*=\s*(.+)$/)
    if (!m) continue
    const [, key, rhsRaw] = m
    if (key === 'depends_on' || key === 'tags') continue
    const rhs = rhsRaw.trim()
    if (rhs.startsWith('"') && rhs.endsWith('"')) {
      props[key] = rhs.slice(1, -1)
    } else if (rhs === 'true' || rhs === 'false') {
      props[key] = rhs === 'true'
    } else if (/^-?\d+(\.\d+)?$/.test(rhs)) {
      props[key] = Number(rhs)
    }
  }
  return props
}

function prettyLabel(name: string): string {
  return name
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

export function parseTerraformToProject(files: TfInputFile[], projectName = 'Imported Terraform'): Project {
  const combined = files.map((f) => stripHclComments(f.content)).join('\n\n')
  const topBlocks = extractTopLevelBlocks(combined)

  const nodes: InfraNode[] = []
  const edges: InfraEdge[] = []
  const refLookup = new Map<string, { nodeId: string; rawBody: string }>()
  const ts = Date.now()
  let idx = 0

  for (const blk of topBlocks) {
    const resMatch = blk.header.match(/^resource\s+"([^"]+)"\s+"([^"]+)"$/)
    if (resMatch) {
      const [, tfType, resName] = resMatch
      // Skip auto-generated companion helper blocks if importing an Inkfra bundle
      if (
        tfType === 'aws_route_table_association' ||
        tfType === 'aws_lb_target_group_attachment' ||
        tfType === 'aws_s3_bucket_versioning' ||
        tfType === 'aws_s3_bucket_public_access_block' ||
        tfType === 'aws_s3_bucket_server_side_encryption_configuration' ||
        tfType === 'aws_iam_role_policy_attachment'
      ) {
        continue
      }

      const def = catalog.find((c) => c.terraformType === tfType || c.type === tfType)
      if (!def) continue

      const id = `${def.type}_${ts}_${idx++}`
      const props = extractScalarProps(blk.body)
      if (typeof props.db_name === 'string' && !props.name) {
        props.name = props.db_name
        delete props.db_name
      }
      if (tfType === 'aws_security_group') {
        const subBlocks = extractTopLevelBlocks(blk.body)
        const parseRules = (kind: 'ingress' | 'egress') =>
          subBlocks
            .filter((sb) => sb.header === kind)
            .map((sb) => {
              const sp = extractScalarProps(sb.body)
              const proto = String(sp.protocol || 'tcp')
              const fromP = sp.from_port ?? 443
              const toP = sp.to_port ?? fromP
              const cidrMatch = sb.body.match(/cidr_blocks\s*=\s*\["([^"]+)"/)
              const cidr = cidrMatch?.[1] || '0.0.0.0/0'
              if (proto === '-1') return `all ${cidr}`
              return `${proto} ${fromP === toP ? fromP : `${fromP}-${toP}`} ${cidr}`
            })
            .join('\n')
        const ing = parseRules('ingress')
        const eg = parseRules('egress')
        if (ing) props.ingress = ing
        if (eg) props.egress = eg
      }

      nodes.push({
        id,
        type: def.type,
        label: typeof props.name === 'string' && props.name ? props.name : prettyLabel(resName),
        provider: def.provider,
        x: 80 + (idx % 4) * 260,
        y: 80 + Math.floor(idx / 4) * 140,
        properties: props,
      })
      refLookup.set(`${tfType}.${resName}`, { nodeId: id, rawBody: blk.body })
      continue
    }

    const modMatch = blk.header.match(/^module\s+"([^"]+)"$/)
    if (modMatch) {
      const [, modName] = modMatch
      const id = `tf_module_call_${ts}_${idx++}`
      const props = extractScalarProps(blk.body)
      nodes.push({
        id,
        type: 'tf_module_call',
        label: prettyLabel(modName),
        provider: 'terraform',
        x: 80 + (idx % 4) * 260,
        y: 80 + Math.floor(idx / 4) * 140,
        properties: props,
      })
      continue
    }

    const varMatch = blk.header.match(/^variable\s+"([^"]+)"$/)
    if (varMatch) {
      const [, varName] = varMatch
      if (['aws_region', 'azure_location', 'gcp_project', 'gcp_region', 'environment'].includes(varName)) {
        continue
      }
      const id = `tf_variable_${ts}_${idx++}`
      const props = extractScalarProps(blk.body)
      nodes.push({
        id,
        type: 'tf_variable',
        label: varName,
        provider: 'terraform',
        x: 80 + (idx % 4) * 260,
        y: 80 + Math.floor(idx / 4) * 140,
        properties: { name: varName, type: props.type || 'string', default: props.default ?? '' },
      })
      continue
    }

    if (blk.header === 'terraform') {
      const inner = extractTopLevelBlocks(blk.body)
      const backend = inner.find((sb) => /^backend\s+"([^"]+)"$/.test(sb.header))
      if (backend) {
        const bMatch = backend.header.match(/^backend\s+"([^"]+)"$/)!
        const bType = bMatch[1]
        const props = extractScalarProps(backend.body)
        nodes.push({
          id: `tf_backend_${ts}_${idx++}`,
          type: 'tf_backend',
          label: `${bType.toUpperCase()} Backend`,
          provider: 'terraform',
          x: 80,
          y: 80,
          properties: { type: bType, ...props },
        })
      }
    }
  }

  // Infer edges between resources by scanning references inside each block body
  const refEntries = Array.from(refLookup.entries())
  const seenEdges = new Set<string>()
  for (const [selfRef, selfInfo] of refEntries) {
    for (const [targetRef, targetInfo] of refEntries) {
      if (selfRef === targetRef) continue
      const pattern = new RegExp(`\\b${targetRef.replace('.', '\\.')}\\b`)
      if (!pattern.test(selfInfo.rawBody)) continue
      const pairKey = [selfInfo.nodeId, targetInfo.nodeId].sort().join('::')
      if (seenEdges.has(pairKey)) continue
      seenEdges.add(pairKey)

      const kind: EdgeKind =
        targetRef.startsWith('aws_vpc.') ||
        targetRef.startsWith('aws_subnet.') ||
        targetRef.startsWith('azurerm_resource_group.') ||
        targetRef.startsWith('azurerm_virtual_network.') ||
        targetRef.startsWith('google_compute_network.') ||
        targetRef.startsWith('kubernetes_namespace.')
          ? 'contains'
          : 'connects'

      edges.push({
        id: `e_${selfInfo.nodeId}_${targetInfo.nodeId}`,
        source: selfInfo.nodeId,
        target: targetInfo.nodeId,
        kind,
        label: kind === 'contains' ? 'contains' : 'connects',
      })
    }
  }

  const cloudProviders = new Set<Provider>(
    nodes.map((n) => n.provider).filter((p) => p === 'aws' || p === 'azure' || p === 'gcp'),
  )
  const provider: Project['provider'] =
    cloudProviders.size > 1
      ? 'multi'
      : cloudProviders.has('azure')
        ? 'azure'
        : cloudProviders.has('gcp')
          ? 'gcp'
          : 'aws'

  return {
    name: projectName,
    description: `Imported from ${files.length} Terraform file${files.length === 1 ? '' : 's'}`,
    provider,
    exportLayout: files.length > 3 ? 'modular' : 'single',
    nodes,
    edges,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
