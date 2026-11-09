import type { Project } from '../types/ir'
import catalog from '../data/catalog'
import { slugify, hclBlock, hclValue } from './hcl'

interface GenResult {
  files: Record<string, string>
  warnings: string[]
}

const PROVIDER_BLOCKS: Record<string, string> = {
  aws: `terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
`,
  azure: `terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}
`,
  gcp: `terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.gcp_project
  region  = var.gcp_region
}
`,
  multi: `terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
    azurerm = { source = "hashicorp/azurerm", version = "~> 3.0" }
    google = { source = "hashicorp/google", version = "~> 5.0" }
  }
}

provider "aws" {
  region = var.aws_region
}

provider "azurerm" {
  features {}
}

provider "google" {
  project = var.gcp_project
  region  = var.gcp_region
}
`,
}

function varsFor(provider: string): string {
  if (provider === 'aws') return `variable "aws_region" {\n  type    = string\n  default = "us-east-1"\n}\nvariable "environment" {\n  type    = string\n  default = "dev"\n}\n`
  if (provider === 'azure') return `variable "azure_location" {\n  type    = string\n  default = "eastus"\n}\nvariable "environment" {\n  type    = string\n  default = "dev"\n}\n`
  if (provider === 'gcp') return `variable "gcp_project" {\n  type    = string\n  default = "my-project"\n}\nvariable "gcp_region" {\n  type    = string\n  default = "us-central1"\n}\nvariable "environment" {\n  type    = string\n  default = "dev"\n}\n`
  if (provider === 'multi') return `variable "aws_region" {\n  type    = string\n  default = "us-east-1"\n}\nvariable "azure_location" {\n  type    = string\n  default = "eastus"\n}\nvariable "gcp_project" {\n  type    = string\n  default = "my-project"\n}\nvariable "gcp_region" {\n  type    = string\n  default = "us-central1"\n}\nvariable "environment" {\n  type    = string\n  default = "dev"\n}\n`
  return ''
}

export function generateTerraform(project: Project): GenResult {
  const warnings: string[] = []
  const nodes = project.nodes
  const edges = project.edges

  // map nodeId -> terraform resource address name
  const nameMap = new Map<string, string>()
  const used = new Set<string>()
  for (const n of nodes) {
    const def = catalog.find((c) => c.type === n.type)
    const tfType = def?.terraformType || def?.type || n.type
    const base = slugify(n.label || n.id)
    let name = base
    let i = 1
    while (used.has(`${tfType}.${name}`)) {
      name = `${base}_${i++}`
    }
    used.add(`${tfType}.${name}`)
    nameMap.set(n.id, name)
  }

  // dependencies
  const deps = new Map<string, Set<string>>()

  // Heuristic reference wiring: when a resource is connected to a parent it
  // depends on, populate the matching Terraform argument (e.g. vpc_id).
  const REF_ATTRS: Record<string, Record<string, string>> = {
    aws_subnet: { aws_vpc: 'vpc_id' },
    aws_route_table: { aws_vpc: 'vpc_id' },
    aws_internet_gateway: { aws_vpc: 'vpc_id' },
    aws_nat_gateway: { aws_subnet: 'subnet_id' },
    aws_security_group: { aws_vpc: 'vpc_id' },
    aws_instance: { aws_subnet: 'subnet_id', aws_security_group: 'vpc_security_group_ids' },
    aws_lb: { aws_subnet: 'subnets', aws_vpc: 'vpc_id' },
    aws_lb_target_group: { aws_vpc: 'vpc_id' },
  }
  const LIST_ATTRS = new Set(['subnets', 'vpc_security_group_ids', 'subnet_ids', 'security_group_ids'])
  const refAttrs = new Map<string, Record<string, string[]>>()
  for (const e of edges) {
    const src = nodes.find((n) => n.id === e.source)
    const tgt = nodes.find((n) => n.id === e.target)
    if (!src || !tgt) continue
    const attr = REF_ATTRS[src.type]?.[tgt.type]
    if (!attr) continue
    if (!refAttrs.has(src.id)) refAttrs.set(src.id, {})
    const r = refAttrs.get(src.id)!
    if (!r[attr]) r[attr] = []
    const tgtDef = catalog.find((c) => c.type === tgt.type)
    const tgtType = tgtDef?.terraformType || tgt.type
    const tgtName = nameMap.get(tgt.id)
    if (tgtName) r[attr].push(`${tgtType}.${tgtName}.id`)
  }
  for (const e of edges) {
    if (e.kind === 'depends_on' || e.kind === 'contains' || e.kind === 'mounts') {
      if (!deps.has(e.source)) deps.set(e.source, new Set())
      const targetName = nameMap.get(e.target)
      const targetNode = nodes.find((n) => n.id === e.target)
      const targetDef = targetNode ? catalog.find((c) => c.type === targetNode.type) : undefined
      const targetType = targetDef?.terraformType || targetNode?.type
      if (targetName && targetType) {
        deps.get(e.source)!.add(`${targetType}.${targetName}`)
      }
    }
  }

  const provider = project.provider || 'aws'
  const providerBlock = PROVIDER_BLOCKS[provider] || PROVIDER_BLOCKS.aws

  const blocks: string[] = []
  blocks.push('# Generated by Inkfra - Visual-to-IaC Canvas')
  blocks.push(`# Project: ${project.name}`)
  blocks.push('')

  for (const n of nodes) {
    const def = catalog.find((c) => c.type === n.type)
    const tfType = def?.terraformType
    if (!tfType) {
      warnings.push(`Resource "${n.label}" (${n.type}) has no Terraform mapping; skipped.`)
      continue
    }
    if (def && def.provider !== 'terraform' && def.provider !== 'generic' && def.provider !== project.provider && project.provider !== 'multi') {
      // allow cross-provider resources but warn
    }
    const name = nameMap.get(n.id)!
    const props = { ...(n.properties || {}) }
    const extra: string[] = []
    // Coerce boolean-like strings.
    for (const k of Object.keys(props)) {
      if (props[k] === 'true') props[k] = true
      if (props[k] === 'false') props[k] = false
    }
    // Wire references from connected parents.
    const refs = refAttrs.get(n.id)
    if (refs) {
      for (const [attr, vals] of Object.entries(refs)) {
        if (!vals.length) continue
        const list = LIST_ATTRS.has(attr) || vals.length > 1
        const expr = list ? `[${vals.join(', ')}]` : vals[0]
        props[attr] = `\${${expr}}`
      }
    }
    // Some AWS resources accept `name` as a real argument; for the rest, expose
    // the friendly name via tags and drop the invalid `name` argument.
    const AWS_NAME_ARG = new Set([
      'aws_lb', 'aws_lb_target_group', 'aws_security_group', 'aws_iam_role',
      'aws_iam_policy', 'aws_sqs_queue', 'aws_sns_topic', 'aws_ecr_repository',
      'aws_ecs_cluster', 'aws_eks_cluster', 'aws_cognito_user_pool',
      'aws_kinesis_stream', 'aws_api_gateway_rest_api', 'aws_ssm_parameter',
      'aws_dynamodb_table', 'aws_route53_zone', 'aws_db_instance',
    ])
    if (tfType.startsWith('aws_')) {
      if (props.name) {
        extra.push(`tags = merge(local.common_tags, { Name = ${hclValue(props.name)} })`)
        if (!AWS_NAME_ARG.has(tfType)) delete props.name
      } else {
        extra.push('tags = local.common_tags')
      }
    }
    const dset = deps.get(n.id)
    if (dset && dset.size) {
      extra.push(`depends_on = [${Array.from(dset).join(', ')}]`)
    }
    blocks.push(hclBlock(tfType, name, props, extra))
  }

  // connections as comments
  const connLines = edges
    .filter((e) => e.kind === 'connects' || e.kind === 'traffic' || e.kind === 'routes_to')
    .map((e) => {
      const s = nodes.find((n) => n.id === e.source)
      const t = nodes.find((n) => n.id === e.target)
      return `# ${s?.label ?? e.source} --[${e.kind}]--> ${t?.label ?? e.target}`
    })
  if (connLines.length) {
    blocks.push('# --- Connections ---')
    blocks.push(connLines.join('\n'))
    blocks.push('')
  }

  const localsBlock = `locals {\n  common_tags = {\n    Project     = ${hclValue(project.name)}\n    Environment = var.environment\n    ManagedBy   = "Inkfra"\n  }\n}\n`
  const mainTf = [providerBlock, '', localsBlock, '', ...blocks].join('\n')

  const variablesTf = varsFor(provider)

  const outputsTf = nodes
    .map((n) => {
      const def = catalog.find((c) => c.type === n.type)
      const tfType = def?.terraformType
      if (!tfType) return null
      const name = nameMap.get(n.id)!
      const outName = `${name}_${tfType.replace(/[^a-z0-9_]/g, '_')}`
      return `output "${outName}_id" {\n  value = ${tfType}.${name}.id\n}\n`
    })
    .filter(Boolean)
    .join('\n')

  const readme = `# ${project.name}\n\nGenerated by Inkfra.\n\n## Usage\n\n\`\`\`bash\nterraform init\nterraform plan\nterraform apply\n\`\`\`\n`

  return {
    files: {
      'main.tf': mainTf,
      'variables.tf': variablesTf,
      'outputs.tf': outputsTf,
      'README.md': readme,
    },
    warnings,
  }
}
