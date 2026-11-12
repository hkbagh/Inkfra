import type { Category, InfraNode, Project } from '../types/ir'
import catalog from '../data/catalog'
import { DEVOPS_ARTIFACT_TYPES, generateDevOpsFiles } from './devops'
import { alignAttributes, hclBlock, hclValue, slugify } from './hcl'

export interface GenResult {
  files: Record<string, string>
  warnings: string[]
}

interface RefRule {
  attr: string
  ref?: string
}

// Keyed by resolved Terraform resource type (or catalog type for meta nodes)
const REF_ATTRS: Record<string, Record<string, RefRule>> = {
  aws_subnet: { aws_vpc: { attr: 'vpc_id' } },
  aws_route_table: { aws_vpc: { attr: 'vpc_id' } },
  aws_internet_gateway: { aws_vpc: { attr: 'vpc_id' } },
  aws_nat_gateway: { aws_subnet: { attr: 'subnet_id' } },
  aws_security_group: { aws_vpc: { attr: 'vpc_id' } },
  aws_instance: {
    aws_subnet: { attr: 'subnet_id' },
    aws_security_group: { attr: 'vpc_security_group_ids' },
  },
  aws_lb: {
    aws_subnet: { attr: 'subnets' },
    aws_security_group: { attr: 'security_groups' },
  },
  aws_lb_target_group: { aws_vpc: { attr: 'vpc_id' } },
  aws_lb_listener: { aws_lb: { attr: 'load_balancer_arn', ref: 'arn' } },
  aws_eks_cluster: { aws_iam_role: { attr: 'role_arn', ref: 'arn' } },
  aws_lambda_function: { aws_iam_role: { attr: 'role', ref: 'arn' } },
  aws_db_instance: { aws_security_group: { attr: 'vpc_security_group_ids' } },
  azurerm_virtual_network: { azurerm_resource_group: { attr: 'resource_group_name', ref: 'name' } },
  azurerm_subnet: {
    azurerm_resource_group: { attr: 'resource_group_name', ref: 'name' },
    azurerm_virtual_network: { attr: 'virtual_network_name', ref: 'name' },
  },
  azurerm_network_security_group: { azurerm_resource_group: { attr: 'resource_group_name', ref: 'name' } },
  azurerm_linux_virtual_machine: { azurerm_resource_group: { attr: 'resource_group_name', ref: 'name' } },
  azurerm_storage_account: { azurerm_resource_group: { attr: 'resource_group_name', ref: 'name' } },
  azurerm_mssql_server: { azurerm_resource_group: { attr: 'resource_group_name', ref: 'name' } },
  azurerm_kubernetes_cluster: { azurerm_resource_group: { attr: 'resource_group_name', ref: 'name' } },
  azurerm_container_registry: { azurerm_resource_group: { attr: 'resource_group_name', ref: 'name' } },
  azurerm_lb: { azurerm_resource_group: { attr: 'resource_group_name', ref: 'name' } },
  azurerm_linux_web_app: { azurerm_resource_group: { attr: 'resource_group_name', ref: 'name' } },
  azurerm_linux_function_app: { azurerm_resource_group: { attr: 'resource_group_name', ref: 'name' } },
  azurerm_cosmosdb_account: { azurerm_resource_group: { attr: 'resource_group_name', ref: 'name' } },
  azurerm_key_vault: { azurerm_resource_group: { attr: 'resource_group_name', ref: 'name' } },
  azurerm_servicebus_namespace: { azurerm_resource_group: { attr: 'resource_group_name', ref: 'name' } },
  azurerm_eventhub_namespace: { azurerm_resource_group: { attr: 'resource_group_name', ref: 'name' } },
  google_compute_subnetwork: { google_compute_network: { attr: 'network' } },
  google_compute_firewall: { google_compute_network: { attr: 'network', ref: 'name' } },
  google_compute_instance: { google_compute_subnetwork: { attr: 'subnetwork' } },
  docker_container: { docker_image: { attr: 'image', ref: 'image_id' } },
  kubernetes_deployment: { kubernetes_namespace: { attr: 'namespace', ref: 'metadata[0].name' } },
  kubernetes_service: { kubernetes_namespace: { attr: 'namespace', ref: 'metadata[0].name' } },
  kubernetes_ingress_v1: { kubernetes_namespace: { attr: 'namespace', ref: 'metadata[0].name' } },
  kubernetes_config_map: { kubernetes_namespace: { attr: 'namespace', ref: 'metadata[0].name' } },
  kubernetes_secret: { kubernetes_namespace: { attr: 'namespace', ref: 'metadata[0].name' } },
  kubernetes_persistent_volume_claim: { kubernetes_namespace: { attr: 'namespace', ref: 'metadata[0].name' } },
}

const LIST_ATTRS = new Set(['subnets', 'vpc_security_group_ids', 'security_groups', 'subnet_ids', 'security_group_ids'])

const AWS_NAME_ARG = new Set([
  'aws_lb',
  'aws_lb_target_group',
  'aws_security_group',
  'aws_iam_role',
  'aws_iam_policy',
  'aws_sqs_queue',
  'aws_sns_topic',
  'aws_ecr_repository',
  'aws_ecs_cluster',
  'aws_eks_cluster',
  'aws_cognito_user_pool',
  'aws_kinesis_stream',
  'aws_api_gateway_rest_api',
  'aws_ssm_parameter',
  'aws_dynamodb_table',
  'aws_route53_zone',
  'aws_db_instance',
])

const META_NODE_TYPES = new Set([
  'tf_provider',
  'tf_backend',
  'tf_variable',
  'tf_output',
  'tf_module_call',
  'devops_terraform_module',
])

type CategoryFile = 'network.tf' | 'compute.tf' | 'database.tf' | 'security.tf' | 'storage.tf' | 'platform.tf'

function categoryFileFor(cat: Category | undefined): CategoryFile {
  switch (cat) {
    case 'network':
      return 'network.tf'
    case 'compute':
      return 'compute.tf'
    case 'database':
      return 'database.tf'
    case 'security':
    case 'identity':
      return 'security.tf'
    case 'storage':
      return 'storage.tf'
    default:
      return 'platform.tf'
  }
}

function resolveTfType(node: InfraNode): string | undefined {
  const def = catalog.find((c) => c.type === node.type)
  return def?.terraformType
}

function getLinkedPeers(project: Project, nodeId: string): InfraNode[] {
  const peerIds = new Set<string>()
  for (const e of project.edges) {
    if (e.source === nodeId) peerIds.add(e.target)
    else if (e.target === nodeId) peerIds.add(e.source)
  }
  return project.nodes.filter((n) => peerIds.has(n.id))
}

function parseSgRuleBlock(kind: 'ingress' | 'egress', raw: unknown): string[] {
  if (typeof raw !== 'string' || !raw.trim()) return []
  const blocks: string[] = []
  const lines = raw
    .split(/[\n,;]+/)
    .map((l) => l.trim())
    .filter(Boolean)

  for (const line of lines) {
    const parts = line.split(/\s+/)
    const protoRaw = parts[0]?.toLowerCase() ?? 'tcp'
    if (protoRaw === 'all' || protoRaw === '-1') {
      const cidr = parts.find((p, idx) => idx > 0 && p.includes('/')) ?? parts[2] ?? parts[1] ?? '0.0.0.0/0'
      blocks.push(
        `${kind} {\n  from_port   = 0\n  to_port     = 0\n  protocol    = "-1"\n  cidr_blocks = [${hclValue(cidr)}]\n}`,
      )
      continue
    }
    const portSpec = parts[1] ?? '443'
    const [fromStr, toStr] = portSpec.split('-')
    const fromPort = Number(fromStr)
    const toPort = Number(toStr ?? fromStr)
    const cidr = parts[2] ?? '0.0.0.0/0'
    if (!Number.isFinite(fromPort) || !Number.isFinite(toPort)) continue
    blocks.push(
      `${kind} {\n  from_port   = ${fromPort}\n  to_port     = ${toPort}\n  protocol    = ${hclValue(protoRaw)}\n  cidr_blocks = [${hclValue(cidr)}]\n}`,
    )
  }
  return blocks
}

function formatBackendBlock(backendNode: InfraNode | undefined): string {
  if (!backendNode) return ''
  const bType = typeof backendNode.properties?.type === 'string' ? backendNode.properties.type : ''
  if (!bType) return ''
  const entries: Array<[string, string]> = []
  const p = backendNode.properties || {}
  if (bType === 's3') {
    if (p.bucket) entries.push(['bucket', hclValue(p.bucket)])
    if (p.key) entries.push(['key', hclValue(p.key)])
    if (p.region) entries.push(['region', hclValue(p.region)])
    if (p.encrypt !== undefined) entries.push(['encrypt', hclValue(Boolean(p.encrypt))])
    if (p.use_lockfile) entries.push(['use_lockfile', hclValue(true)])
  } else if (bType === 'azurerm') {
    if (p.bucket) entries.push(['container_name', hclValue(p.bucket)])
    if (p.key) entries.push(['key', hclValue(p.key)])
  } else if (bType === 'gcs') {
    if (p.bucket) entries.push(['bucket', hclValue(p.bucket)])
    if (p.key) entries.push(['prefix', hclValue(p.key)])
  } else if (bType === 'local' && p.key) {
    entries.push(['path', hclValue(p.key)])
  }
  if (entries.length === 0) return `\n  backend "${bType}" {}\n`
  return `\n  backend "${bType}" {\n${alignAttributes(entries, '    ').join('\n')}\n  }\n`
}

function buildVersionsAndProviders(project: Project): { versionsTf: string; providersTf: string } {
  const provider = project.provider || 'aws'
  const tfTypes = project.nodes.map((n) => resolveTfType(n)).filter((t): t is string => Boolean(t))

  const reqProviders: Array<[string, string, string]> = []
  const providerConfigs: string[] = []

  const needAws = provider === 'aws' || provider === 'multi' || tfTypes.some((t) => t.startsWith('aws_'))
  const needAzure = provider === 'azure' || provider === 'multi' || tfTypes.some((t) => t.startsWith('azurerm_'))
  const needGcp = provider === 'gcp' || provider === 'multi' || tfTypes.some((t) => t.startsWith('google_'))
  const needK8s = tfTypes.some((t) => t.startsWith('kubernetes_'))
  const needDocker = tfTypes.some((t) => t.startsWith('docker_'))
  const needHelm = tfTypes.some((t) => t === 'helm_release')

  if (needAws) {
    reqProviders.push(['aws', 'hashicorp/aws', '~> 5.0'])
    providerConfigs.push(`provider "aws" {\n  region = var.aws_region\n}`)
  }
  if (needAzure) {
    reqProviders.push(['azurerm', 'hashicorp/azurerm', '~> 3.0'])
    providerConfigs.push(`provider "azurerm" {\n  features {}\n}`)
  }
  if (needGcp) {
    reqProviders.push(['google', 'hashicorp/google', '~> 5.0'])
    providerConfigs.push(`provider "google" {\n  project = var.gcp_project\n  region  = var.gcp_region\n}`)
  }
  if (needK8s) {
    reqProviders.push(['kubernetes', 'hashicorp/kubernetes', '~> 2.25'])
    providerConfigs.push(`provider "kubernetes" {\n  config_path = "~/.kube/config"\n}`)
  }
  if (needDocker) {
    reqProviders.push(['docker', 'kreuzwerker/docker', '~> 3.0'])
    providerConfigs.push(`provider "docker" {}`)
  }
  if (needHelm) {
    reqProviders.push(['helm', 'hashicorp/helm', '~> 2.12'])
    providerConfigs.push(`provider "helm" {}`)
  }

  if (reqProviders.length === 0) {
    reqProviders.push(['aws', 'hashicorp/aws', '~> 5.0'])
    providerConfigs.push(`provider "aws" {\n  region = var.aws_region\n}`)
  }

  const backendNode = project.nodes.find((n) => n.type === 'tf_backend')
  const backendBlock = formatBackendBlock(backendNode)

  const reqEntries = reqProviders.map(
    ([alias, source, version]) => `    ${alias} = {\n      source  = "${source}"\n      version = "${version}"\n    }`,
  )

  const versionsTf = `terraform {\n  required_version = ">= 1.5.0"\n${backendBlock}\n  required_providers {\n${reqEntries.join('\n')}\n  }\n}`
  const providersTf = providerConfigs.join('\n\n')
  return { versionsTf, providersTf }
}

function buildVariablesTf(
  project: Project,
  secretVars: Array<{ name: string; description: string }>,
): string {
  const provider = project.provider || 'aws'
  const tfTypes = project.nodes.map((n) => resolveTfType(n)).filter((t): t is string => Boolean(t))

  const needAws = provider === 'aws' || provider === 'multi' || tfTypes.some((t) => t.startsWith('aws_'))
  const needAzure = provider === 'azure' || provider === 'multi' || tfTypes.some((t) => t.startsWith('azurerm_'))
  const needGcp = provider === 'gcp' || provider === 'multi' || tfTypes.some((t) => t.startsWith('google_'))

  const blocks: string[] = []
  if (needAws) {
    blocks.push(
      `variable "aws_region" {\n  description = "AWS region for deployed resources"\n  type        = string\n  default     = "us-east-1"\n}`,
    )
  }
  if (needAzure) {
    blocks.push(
      `variable "azure_location" {\n  description = "Azure region for deployed resources"\n  type        = string\n  default     = "eastus"\n}`,
    )
  }
  if (needGcp) {
    blocks.push(
      `variable "gcp_project" {\n  description = "GCP project ID"\n  type        = string\n  default     = "my-project"\n}`,
      `variable "gcp_region" {\n  description = "GCP region for deployed resources"\n  type        = string\n  default     = "us-central1"\n}`,
    )
  }
  blocks.push(
    `variable "environment" {\n  description = "Deployment environment name (e.g. dev, staging, prod)"\n  type        = string\n  default     = "dev"\n}`,
  )

  for (const sv of secretVars) {
    blocks.push(
      `variable "${sv.name}" {\n  description = ${hclValue(sv.description)}\n  type        = string\n  sensitive   = true\n}`,
    )
  }

  for (const n of project.nodes) {
    if (n.type !== 'tf_variable') continue
    const varName = slugify(String(n.properties?.name || n.label || 'var'))
    const varType = String(n.properties?.type || 'string')
    const defVal = n.properties?.default
    const lines = [`  description = ${hclValue(`User-defined variable ${varName}`)}`, `  type        = ${varType}`]
    if (defVal !== undefined && defVal !== '') {
      lines.push(`  default     = ${hclValue(defVal)}`)
    }
    blocks.push(`variable "${varName}" {\n${lines.join('\n')}\n}`)
  }

  return blocks.join('\n\n') + '\n'
}

function buildBackendBootstrap(project: Project): string | null {
  const backendNode = project.nodes.find((n) => n.type === 'tf_backend')
  if (!backendNode) return null
  const bType = String(backendNode.properties?.type || 's3')
  const bucket = String(backendNode.properties?.bucket || 'my-terraform-state')
  const region = String(backendNode.properties?.region || 'us-east-1')

  if (bType !== 's3') return null
  return `# Standalone bootstrap stack to provision the encrypted remote state S3 bucket.
# Apply once before running "terraform init" on the root stack.

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = ${hclValue(region)}
}

resource "aws_s3_bucket" "tf_state" {
  bucket = ${hclValue(bucket)}
}

resource "aws_s3_bucket_versioning" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
`
}

function buildRepoScaffolding(project: Project): Record<string, string> {
  const provider = project.provider || 'aws'
  const tfTypes = project.nodes.map((n) => resolveTfType(n)).filter((t): t is string => Boolean(t))
  const needAws = provider === 'aws' || provider === 'multi' || tfTypes.some((t) => t.startsWith('aws_'))
  const needAzure = provider === 'azure' || provider === 'multi' || tfTypes.some((t) => t.startsWith('azurerm_'))
  const needGcp = provider === 'gcp' || provider === 'multi' || tfTypes.some((t) => t.startsWith('google_'))

  const makeEnvVars = (env: string) => {
    const lines = [`environment = "${env}"`]
    if (needAws) lines.push(`aws_region  = "us-east-1"`)
    if (needAzure) lines.push(`azure_location = "eastus"`)
    if (needGcp) {
      lines.push(`gcp_project = "my-gcp-project-${env}"`, `gcp_region  = "us-central1"`)
    }
    return lines.join('\n') + '\n'
  }

  return {
    'terraform.tfvars.example': `# Copy to terraform.tfvars or use environments/<env>/terraform.tfvars\n# Supply sensitive variables via TF_VAR_* environment variables.\n${makeEnvVars('dev')}`,
    'environments/dev/terraform.tfvars': makeEnvVars('dev'),
    'environments/staging/terraform.tfvars': makeEnvVars('staging'),
    'environments/prod/terraform.tfvars': makeEnvVars('prod'),
    '.gitignore': `.terraform/
.terraform.lock.hcl
*.tfstate
*.tfstate.*
*.tfvars
!terraform.tfvars.example
!environments/*/terraform.tfvars
tfplan
crash.log
`,
    '.tflint.hcl': `plugin "terraform" {
  enabled = true
  preset  = "recommended"
}

rule "terraform_documented_variables" {
  enabled = true
}

rule "terraform_documented_outputs" {
  enabled = true
}
`,
    Makefile: `ENV ?= dev
TF  ?= terraform

.PHONY: init fmt validate lint plan apply destroy

init:
\t$(TF) init

fmt:
\t$(TF) fmt -recursive

validate:
\t$(TF) fmt -check -recursive
\t$(TF) init -backend=false
\t$(TF) validate

lint:
\ttflint --init && tflint -f compact

plan:
\t$(TF) plan -var-file=environments/$(ENV)/terraform.tfvars -out=tfplan

apply:
\t$(TF) apply -auto-approve tfplan

destroy:
\t$(TF) destroy -var-file=environments/$(ENV)/terraform.tfvars
`,
  }
}

export function generateTerraform(project: Project): GenResult {
  const warnings: string[] = []
  const nodes = project.nodes
  const edges = project.edges
  const layout = project.exportLayout === 'single' ? 'single' : 'modular'

  // Map nodeId -> Terraform resource identifier
  const nameMap = new Map<string, string>()
  const used = new Set<string>()
  for (const n of nodes) {
    const tfType = resolveTfType(n) || n.type
    const base = slugify(n.label || n.id)
    let name = base
    let i = 1
    while (used.has(`${tfType}.${name}`)) {
      name = `${base}_${i++}`
    }
    used.add(`${tfType}.${name}`)
    nameMap.set(n.id, name)
  }

  // Build reference wiring (supports edges drawn in either direction between child and parent)
  const refAttrs = new Map<string, Record<string, string[]>>()
  const pushRef = (nodeId: string, attr: string, expr: string) => {
    if (!refAttrs.has(nodeId)) refAttrs.set(nodeId, {})
    const map = refAttrs.get(nodeId)!
    if (!map[attr]) map[attr] = []
    if (!map[attr].includes(expr)) map[attr].push(expr)
  }

  for (const e of edges) {
    const a = nodes.find((n) => n.id === e.source)
    const b = nodes.find((n) => n.id === e.target)
    if (!a || !b) continue
    const aTf = resolveTfType(a) || a.type
    const bTf = resolveTfType(b) || b.type

    const forwardRule = REF_ATTRS[aTf]?.[bTf]
    if (forwardRule) {
      const bName = nameMap.get(b.id)
      if (bName) pushRef(a.id, forwardRule.attr, `${bTf}.${bName}.${forwardRule.ref ?? 'id'}`)
    }
    const reverseRule = REF_ATTRS[bTf]?.[aTf]
    if (reverseRule) {
      const aName = nameMap.get(a.id)
      if (aName) pushRef(b.id, reverseRule.attr, `${aTf}.${aName}.${reverseRule.ref ?? 'id'}`)
    }
  }

  // Explicit depends_on for structural edges
  const deps = new Map<string, Set<string>>()
  for (const e of edges) {
    if (e.kind === 'depends_on' || e.kind === 'contains' || e.kind === 'mounts') {
      const src = nodes.find((n) => n.id === e.source)
      const tgt = nodes.find((n) => n.id === e.target)
      if (!src || !tgt) continue
      const targetTf = resolveTfType(tgt)
      const targetName = nameMap.get(tgt.id)
      if (targetName && targetTf) {
        if (!deps.has(e.source)) deps.set(e.source, new Set())
        deps.get(e.source)!.add(`${targetTf}.${targetName}`)
      }
    }
  }

  const categoryBlocks: Record<CategoryFile, string[]> = {
    'network.tf': [],
    'compute.tf': [],
    'database.tf': [],
    'security.tf': [],
    'storage.tf': [],
    'platform.tf': [],
  }
  const orderedBlocks: string[] = []
  const dataBlocks: string[] = []
  const secretVars: Array<{ name: string; description: string }> = []
  const emittedSecretNames = new Set<string>()
  let needAwsAmiData = false
  let needAzureClientConfig = false

  const emitBlock = (file: CategoryFile, blockText: string) => {
    categoryBlocks[file].push(blockText)
    orderedBlocks.push(blockText)
  }

  const registerSecretVar = (varName: string, description: string) => {
    if (!emittedSecretNames.has(varName)) {
      emittedSecretNames.add(varName)
      secretVars.push({ name: varName, description })
    }
  }

  for (const n of nodes) {
    const def = catalog.find((c) => c.type === n.type)
    const targetFile = categoryFileFor(def?.category)

    if (n.type === 'tf_module_call' || n.type === 'devops_terraform_module') {
      const modName = nameMap.get(n.id)!
      const entries: Array<[string, string]> = []
      if (n.properties?.source) entries.push(['source', hclValue(n.properties.source)])
      if (n.properties?.version) entries.push(['version', hclValue(n.properties.version)])
      const aligned = alignAttributes(entries, '  ').join('\n')
      emitBlock('platform.tf', `module "${modName}" {\n${aligned ? aligned + '\n' : ''}}\n`)
      continue
    }
    if (META_NODE_TYPES.has(n.type) || DEVOPS_ARTIFACT_TYPES.has(n.type)) continue

    const tfType = def?.terraformType
    if (!tfType) {
      if (def?.provider !== 'generic') {
        warnings.push(`Resource "${n.label}" (${n.type}) has no Terraform mapping; skipped.`)
      }
      continue
    }

    if (
      def &&
      (def.provider === 'aws' || def.provider === 'azure' || def.provider === 'gcp') &&
      def.provider !== project.provider &&
      project.provider !== 'multi'
    ) {
      warnings.push(
        `Resource "${n.label}" uses ${def.provider.toUpperCase()} while target is ${project.provider.toUpperCase()}.`,
      )
    }

    const name = nameMap.get(n.id)!
    const props: Record<string, unknown> = { ...(n.properties || {}) }
    const extra: string[] = []
    const companionBlocks: string[] = []
    const peers = getLinkedPeers(project, n.id)

    for (const k of Object.keys(props)) {
      if (props[k] === 'true') props[k] = true
      if (props[k] === 'false') props[k] = false
    }

    const refs = refAttrs.get(n.id)
    if (refs) {
      for (const [attr, vals] of Object.entries(refs)) {
        if (!vals.length) continue
        const isList = LIST_ATTRS.has(attr) || vals.length > 1
        const expr = isList ? `[${vals.join(', ')}]` : vals[0]
        props[attr] = `\${${expr}}`
      }
    }

    // ---------- AWS transformations & implicit glue ----------
    if (tfType === 'aws_instance') {
      if (!props.ami || props.ami === 'auto') {
        needAwsAmiData = true
        props.ami = '${data.aws_ami.amazon_linux.id}'
      }
      const volSize = Number(props.root_volume_size) || 20
      extra.push(`root_block_device {\n  volume_size = ${volSize}\n  encrypted   = true\n}`)
      extra.push(`metadata_options {\n  http_endpoint = "enabled"\n  http_tokens   = "required"\n}`)
      delete props.root_volume_size
    }

    if (tfType === 'aws_nat_gateway' && props.connectivity_type !== 'private') {
      companionBlocks.push(
        `resource "aws_eip" "${name}_eip" {\n  domain = "vpc"\n  tags   = merge(local.common_tags, { Name = "${name}-eip" })\n}`,
      )
      props.allocation_id = `\${aws_eip.${name}_eip.id}`
    }

    if (tfType === 'aws_route_table') {
      for (const peer of peers) {
        const peerTf = resolveTfType(peer)
        const peerName = nameMap.get(peer.id)
        if (!peerTf || !peerName) continue
        if (peerTf === 'aws_subnet') {
          companionBlocks.push(
            `resource "aws_route_table_association" "${peerName}_${name}" {\n  subnet_id      = aws_subnet.${peerName}.id\n  route_table_id = aws_route_table.${name}.id\n}`,
          )
        } else if (peerTf === 'aws_internet_gateway') {
          companionBlocks.push(
            `resource "aws_route" "${name}_igw" {\n  route_table_id         = aws_route_table.${name}.id\n  destination_cidr_block = "0.0.0.0/0"\n  gateway_id             = aws_internet_gateway.${peerName}.id\n}`,
          )
        } else if (peerTf === 'aws_nat_gateway') {
          companionBlocks.push(
            `resource "aws_route" "${name}_nat" {\n  route_table_id         = aws_route_table.${name}.id\n  destination_cidr_block = "0.0.0.0/0"\n  nat_gateway_id         = aws_nat_gateway.${peerName}.id\n}`,
          )
        }
      }
    }

    if (tfType === 'aws_security_group') {
      extra.push(...parseSgRuleBlock('ingress', props.ingress))
      extra.push(...parseSgRuleBlock('egress', props.egress))
      delete props.ingress
      delete props.egress
    }

    if (tfType === 'aws_lb_target_group') {
      const tgPort = Number(props.port) || 80
      for (const peer of peers) {
        if (resolveTfType(peer) === 'aws_instance') {
          const ec2Name = nameMap.get(peer.id)!
          companionBlocks.push(
            `resource "aws_lb_target_group_attachment" "${name}_${ec2Name}" {\n  target_group_arn = aws_lb_target_group.${name}.arn\n  target_id        = aws_instance.${ec2Name}.id\n  port             = ${tgPort}\n}`,
          )
        }
      }
    }

    if (tfType === 'aws_lb_listener') {
      const linkedTg = peers.find((x) => resolveTfType(x) === 'aws_lb_target_group')
      if (linkedTg) {
        const tgName = nameMap.get(linkedTg.id)
        extra.push(
          `default_action {\n  type             = "forward"\n  target_group_arn = aws_lb_target_group.${tgName}.arn\n}`,
        )
      } else {
        extra.push(
          `default_action {\n  type = "fixed-response"\n  fixed_response {\n    content_type = "text/plain"\n    message_body = "OK"\n    status_code  = "200"\n  }\n}`,
        )
      }
    }

    if (tfType === 'aws_db_instance') {
      if (props.name) {
        props.db_name = props.name
        delete props.name
      }
      // Strip plaintext passwords and emit a sensitive variable reference
      const pwVar = `${name}_password`
      registerSecretVar(pwVar, `Master password for RDS instance ${name}`)
      props.password = `\${var.${pwVar}}`
      props.storage_encrypted = true
      props.publicly_accessible = false

      const dbSubnets = peers.filter((p) => resolveTfType(p) === 'aws_subnet')
      if (dbSubnets.length > 0) {
        const subIds = dbSubnets.map((s) => `aws_subnet.${nameMap.get(s.id)}.id`).join(', ')
        companionBlocks.push(
          `resource "aws_db_subnet_group" "${name}_subnets" {\n  name       = "${name}-subnets"\n  subnet_ids = [${subIds}]\n  tags       = local.common_tags\n}`,
        )
        props.db_subnet_group_name = `\${aws_db_subnet_group.${name}_subnets.name}`
      }
    }

    if (tfType === 'aws_eks_cluster') {
      if (!props.role_arn) {
        companionBlocks.push(
          `resource "aws_iam_role" "${name}_eks_role" {\n  name = "${name}-eks-role"\n\n  assume_role_policy = jsonencode({\n    Version = "2012-10-17"\n    Statement = [{\n      Action    = "sts:AssumeRole"\n      Effect    = "Allow"\n      Principal = { Service = "eks.amazonaws.com" }\n    }]\n  })\n  tags = local.common_tags\n}`,
          `resource "aws_iam_role_policy_attachment" "${name}_eks_policy" {\n  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"\n  role       = aws_iam_role.${name}_eks_role.name\n}`,
        )
        props.role_arn = `\${aws_iam_role.${name}_eks_role.arn}`
      }
      const eksSubnets = peers.filter((p) => resolveTfType(p) === 'aws_subnet')
      const subRefs = eksSubnets.length ? eksSubnets.map((s) => `aws_subnet.${nameMap.get(s.id)}.id`).join(', ') : ''
      extra.push(`vpc_config {\n  subnet_ids = [${subRefs}]\n}`)
    }

    if (tfType === 'aws_lambda_function' && !props.role) {
      companionBlocks.push(
        `resource "aws_iam_role" "${name}_lambda_role" {\n  name = "${name}-lambda-role"\n\n  assume_role_policy = jsonencode({\n    Version = "2012-10-17"\n    Statement = [{\n      Action    = "sts:AssumeRole"\n      Effect    = "Allow"\n      Principal = { Service = "lambda.amazonaws.com" }\n    }]\n  })\n  tags = local.common_tags\n}`,
        `resource "aws_iam_role_policy_attachment" "${name}_lambda_logs" {\n  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"\n  role       = aws_iam_role.${name}_lambda_role.name\n}`,
      )
      props.role = `\${aws_iam_role.${name}_lambda_role.arn}`
      if (!props.filename && !props.s3_bucket) {
        props.filename = 'lambda.zip'
      }
    }

    if (tfType === 'aws_cloudfront_distribution') {
      const originS3 = peers.find((p) => resolveTfType(p) === 'aws_s3_bucket')
      const originAlb = peers.find((p) => resolveTfType(p) === 'aws_lb')
      const domainExpr = originS3
        ? `aws_s3_bucket.${nameMap.get(originS3.id)}.bucket_regional_domain_name`
        : originAlb
          ? `aws_lb.${nameMap.get(originAlb.id)}.dns_name`
          : `"example.com"`
      props.enabled = true
      extra.push(
        `origin {\n  domain_name = ${domainExpr}\n  origin_id   = "${name}-origin"\n}`,
        `default_cache_behavior {\n  allowed_methods        = ["GET", "HEAD"]\n  cached_methods         = ["GET", "HEAD"]\n  target_origin_id       = "${name}-origin"\n  viewer_protocol_policy = "redirect-to-https"\n\n  forwarded_values {\n    query_string = false\n    cookies {\n      forward = "none"\n    }\n  }\n}`,
        `restrictions {\n  geo_restriction {\n    restriction_type = "none"\n  }\n}`,
        `viewer_certificate {\n  cloudfront_default_certificate = true\n}`,
      )
    }

    if (tfType === 'aws_s3_bucket') {
      const enableVersioning = props.versioning === true
      const bucketAcl = typeof props.acl === 'string' && props.acl ? props.acl : null
      delete props.versioning
      delete props.acl
      if (enableVersioning) {
        companionBlocks.push(
          `resource "aws_s3_bucket_versioning" "${name}_versioning" {\n  bucket = aws_s3_bucket.${name}.id\n\n  versioning_configuration {\n    status = "Enabled"\n  }\n}`,
        )
      }
      companionBlocks.push(
        `resource "aws_s3_bucket_server_side_encryption_configuration" "${name}_sse" {\n  bucket = aws_s3_bucket.${name}.id\n\n  rule {\n    apply_server_side_encryption_by_default {\n      sse_algorithm = "AES256"\n    }\n  }\n}`,
      )
      if (bucketAcl === 'private') {
        companionBlocks.push(
          `resource "aws_s3_bucket_public_access_block" "${name}_public_access" {\n  bucket = aws_s3_bucket.${name}.id\n\n  block_public_acls       = true\n  block_public_policy     = true\n  ignore_public_acls      = true\n  restrict_public_buckets = true\n}`,
        )
      }
    }

    if (tfType === 'aws_dynamodb_table') {
      const hashKey = String(props.hash_key || 'id')
      extra.push(`attribute {\n  name = ${hclValue(hashKey)}\n  type = "S"\n}`)
    }

    if (tfType.startsWith('aws_')) {
      if (props.name) {
        extra.push(`tags = merge(local.common_tags, { Name = ${hclValue(props.name)} })`)
        if (!AWS_NAME_ARG.has(tfType)) delete props.name
      } else {
        extra.push('tags = local.common_tags')
      }
    }

    // ---------- Azure transformations ----------
    if (tfType === 'azurerm_subnet' && typeof props.address_prefixes === 'string') {
      props.address_prefixes = props.address_prefixes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }

    if (tfType === 'azurerm_virtual_network' && typeof props.address_space === 'string') {
      props.address_space = props.address_space
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }

    if (tfType === 'azurerm_linux_virtual_machine') {
      const rgRef = props.resource_group_name || '"rg"'
      const loc = props.location || 'eastus'
      const linkedSubnet = peers.find((p) => resolveTfType(p) === 'azurerm_subnet')
      const subIdExpr = linkedSubnet ? `azurerm_subnet.${nameMap.get(linkedSubnet.id)}.id` : '""'
      companionBlocks.push(
        `resource "azurerm_network_interface" "${name}_nic" {\n  name                = "${name}-nic"\n  location            = ${hclValue(loc)}\n  resource_group_name = ${hclValue(rgRef)}\n\n  ip_configuration {\n    name                          = "internal"\n    subnet_id                     = ${subIdExpr}\n    private_ip_address_allocation = "Dynamic"\n  }\n}`,
      )
      props.network_interface_ids = [`\${azurerm_network_interface.${name}_nic.id}`]
      props.disable_password_authentication = false
      const pwVar = `${name}_admin_password`
      registerSecretVar(pwVar, `Admin password for Azure VM ${name}`)
      props.admin_password = `\${var.${pwVar}}`
      extra.push(
        `os_disk {\n  caching              = "ReadWrite"\n  storage_account_type = "Standard_LRS"\n}`,
        `source_image_reference {\n  publisher = "Canonical"\n  offer     = "0001-com-ubuntu-server-jammy"\n  sku       = "22_04-lts"\n  version   = "latest"\n}`,
      )
    }

    if (tfType === 'azurerm_mssql_server') {
      props.version = '12.0'
      const pwVar = `${name}_sql_password`
      registerSecretVar(pwVar, `Administrator password for Azure SQL ${name}`)
      props.administrator_login_password = `\${var.${pwVar}}`
    }

    if (tfType === 'azurerm_linux_web_app') {
      const rgRef = props.resource_group_name || '"rg"'
      const loc = props.location || 'eastus'
      companionBlocks.push(
        `resource "azurerm_service_plan" "${name}_plan" {\n  name                = "${name}-plan"\n  location            = ${hclValue(loc)}\n  resource_group_name = ${hclValue(rgRef)}\n  os_type             = "Linux"\n  sku_name            = "B1"\n}`,
      )
      props.service_plan_id = `\${azurerm_service_plan.${name}_plan.id}`
      extra.push('site_config {}')
    }

    if (tfType === 'azurerm_kubernetes_cluster') {
      const count = Number(props.default_node_pool_count) || 2
      delete props.default_node_pool_count
      props.dns_prefix = `${name.replace(/_/g, '-')}-dns`
      extra.push(
        `default_node_pool {\n  name       = "default"\n  node_count = ${count}\n  vm_size    = "Standard_DS2_v2"\n}`,
        `identity {\n  type = "SystemAssigned"\n}`,
      )
    }

    if (tfType === 'azurerm_key_vault') {
      if (!props.sku_name) props.sku_name = 'standard'
      if (!props.tenant_id) {
        needAzureClientConfig = true
        props.tenant_id = '${data.azurerm_client_config.current.tenant_id}'
      }
    }

    // ---------- GCP transformations ----------
    if (tfType === 'google_compute_firewall') {
      if (typeof props.source_ranges === 'string') {
        props.source_ranges = props.source_ranges
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      }
      if (typeof props.allowed === 'string' && props.allowed.trim()) {
        const specs = props.allowed
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean)
        for (const spec of specs) {
          const [proto, portsRaw] = spec.split(':')
          const ports = (portsRaw ?? '80')
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean)
          extra.push(`allow {\n  protocol = ${hclValue(proto || 'tcp')}\n  ports    = ${hclValue(ports)}\n}`)
        }
        delete props.allowed
      }
    }

    if (tfType === 'google_compute_instance') {
      const netPeer = peers.find((p) => resolveTfType(p) === 'google_compute_network')
      const subPeer = peers.find((p) => resolveTfType(p) === 'google_compute_subnetwork')
      delete props.subnetwork
      extra.push(`boot_disk {\n  initialize_params {\n    image = "debian-cloud/debian-12"\n  }\n}`)
      const nicEntries: Array<[string, string]> = []
      if (subPeer) nicEntries.push(['subnetwork', `google_compute_subnetwork.${nameMap.get(subPeer.id)}.id`])
      else if (netPeer) nicEntries.push(['network', `google_compute_network.${nameMap.get(netPeer.id)}.id`])
      else nicEntries.push(['network', '"default"'])
      extra.push(`network_interface {\n${alignAttributes(nicEntries, '  ').join('\n')}\n}`)
    }

    if (tfType === 'google_sql_database_instance') {
      const tier = String(props.tier || 'db-f1-micro')
      delete props.tier
      props.deletion_protection = false
      extra.push(`settings {\n  tier = ${hclValue(tier)}\n}`)
    }

    if (tfType === 'google_cloud_run_service') {
      extra.push(
        `template {\n  spec {\n    containers {\n      image = "us-docker.pkg.dev/cloudrun/container/hello"\n    }\n  }\n}`,
      )
    }

    // ---------- Docker & Kubernetes ----------
    if (tfType === 'docker_container') {
      if (props.ports_internal || props.ports_external) {
        const internal = Number(props.ports_internal) || 80
        const external = Number(props.ports_external) || 8080
        extra.push(`ports {\n  internal = ${internal}\n  external = ${external}\n}`)
        delete props.ports_internal
        delete props.ports_external
      }
    }

    if (tfType === 'docker_image') {
      const buildPath = props.build_path
      if (typeof buildPath === 'string' && buildPath.trim()) {
        extra.push(`build {\n  context = ${hclValue(buildPath.trim())}\n}`)
      }
      delete props.build_path
    }

    if (tfType.startsWith('kubernetes_')) {
      const k8sName = String(props.name || name)
      const ns = props.namespace
      delete props.name
      delete props.namespace
      const metaEntries: Array<[string, string]> = [['name', hclValue(k8sName)]]
      if (ns) metaEntries.push(['namespace', hclValue(ns)])
      extra.push(`metadata {\n${alignAttributes(metaEntries, '  ').join('\n')}\n}`)

      if (tfType === 'kubernetes_deployment') {
        const replicas = Number(props.replicas) || 1
        const image = String(props.image || 'nginx:latest')
        const port = Number(props.port) || 80
        delete props.replicas
        delete props.image
        delete props.port
        extra.push(
          `spec {\n  replicas = ${replicas}\n  selector {\n    match_labels = {\n      app = ${hclValue(k8sName)}\n    }\n  }\n  template {\n    metadata {\n      labels = {\n        app = ${hclValue(k8sName)}\n      }\n    }\n    spec {\n      container {\n        name  = ${hclValue(k8sName)}\n        image = ${hclValue(image)}\n        port {\n          container_port = ${port}\n        }\n      }\n    }\n  }\n}`,
        )
      } else if (tfType === 'kubernetes_service') {
        const svcType = String(props.type || 'ClusterIP')
        const port = Number(props.port) || 80
        const targetPort = Number(props.target_port) || port
        delete props.type
        delete props.port
        delete props.target_port
        extra.push(
          `spec {\n  type = ${hclValue(svcType)}\n  selector = {\n    app = ${hclValue(k8sName)}\n  }\n  port {\n    port        = ${port}\n    target_port = ${targetPort}\n  }\n}`,
        )
      } else if (tfType === 'kubernetes_ingress_v1') {
        const host = String(props.host || 'example.com')
        const path = String(props.path || '/')
        const serviceName = String(props.service_name || 'svc')
        delete props.host
        delete props.path
        delete props.service_name
        extra.push(
          `spec {\n  rule {\n    host = ${hclValue(host)}\n    http {\n      path {\n        path      = ${hclValue(path)}\n        path_type = "Prefix"\n        backend {\n          service {\n            name = ${hclValue(serviceName)}\n            port {\n              number = 80\n            }\n          }\n        }\n      }\n    }\n  }\n}`,
        )
      } else if (tfType === 'kubernetes_config_map') {
        const rawData = String(props.data || 'key: value')
        delete props.data
        const kvEntries: Array<[string, string]> = rawData
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean)
          .map((line): [string, string] => {
            const idx = line.indexOf(':')
            if (idx === -1) return [hclValue(line), '"true"']
            const k = line.slice(0, idx).trim()
            const v = line.slice(idx + 1).trim()
            return [hclValue(k), hclValue(v)]
          })
        extra.push(`data = {\n${alignAttributes(kvEntries, '  ').join('\n')}\n}`)
      } else if (tfType === 'kubernetes_persistent_volume_claim') {
        const storageClass = String(props.storage_class || 'standard')
        const accessModes = String(props.access_modes || 'ReadWriteOnce')
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean)
        const storage = String(props.storage || '10Gi')
        delete props.storage_class
        delete props.access_modes
        delete props.storage
        extra.push(
          `spec {\n  access_modes       = ${hclValue(accessModes)}\n  storage_class_name = ${hclValue(storageClass)}\n  resources {\n    requests = {\n      storage = ${hclValue(storage)}\n    }\n  }\n}`,
        )
      } else if (tfType === 'kubernetes_horizontal_pod_autoscaler_v2') {
        const minReplicas = Number(props.min_replicas) || 2
        const maxReplicas = Number(props.max_replicas) || 10
        const targetCpu = Number(props.target_cpu) || 80
        delete props.min_replicas
        delete props.max_replicas
        delete props.target_cpu
        extra.push(
          `spec {\n  min_replicas = ${minReplicas}\n  max_replicas = ${maxReplicas}\n  scale_target_ref {\n    api_version = "apps/v1"\n    kind        = "Deployment"\n    name        = ${hclValue(k8sName.replace(/-hpa$/, ''))}\n  }\n  metric {\n    type = "Resource"\n    resource {\n      name = "cpu"\n      target {\n        type                = "Utilization"\n        average_utilization = ${targetCpu}\n      }\n    }\n  }\n}`,
        )
      }
    }

    const dset = deps.get(n.id)
    if (dset && dset.size) {
      extra.push(`depends_on = [${Array.from(dset).join(', ')}]`)
    }

    emitBlock(targetFile, hclBlock(tfType, name, props, extra))
    for (const cBlock of companionBlocks) {
      emitBlock(targetFile, cBlock)
    }
  }

  if (needAwsAmiData) {
    dataBlocks.push(
      `data "aws_ami" "amazon_linux" {\n  most_recent = true\n  owners      = ["amazon"]\n\n  filter {\n    name   = "name"\n    values = ["al2023-ami-*-x86_64"]\n  }\n}`,
    )
  }
  if (needAzureClientConfig) {
    dataBlocks.push(`data "azurerm_client_config" "current" {}`)
  }

  const connLines = edges
    .filter((e) => e.kind === 'connects' || e.kind === 'traffic' || e.kind === 'routes_to')
    .map((e) => {
      const s = nodes.find((n) => n.id === e.source)
      const t = nodes.find((n) => n.id === e.target)
      return `# ${s?.label ?? e.source} --[${e.kind}]--> ${t?.label ?? e.target}`
    })

  const { versionsTf, providersTf } = buildVersionsAndProviders(project)
  const localsBlock = `locals {\n  common_tags = {\n    Project     = ${hclValue(project.name)}\n    Environment = var.environment\n    ManagedBy   = "Inkfra"\n  }\n}`
  const variablesTf = buildVariablesTf(project, secretVars)

  const resourceOutputs = nodes
    .map((n) => {
      const tfType = resolveTfType(n)
      if (!tfType) return null
      const name = nameMap.get(n.id)!
      const outName = `${name}_${tfType.replace(/[^a-z0-9_]/g, '_')}_id`
      return `output "${outName}" {\n  description = "ID of ${n.label}"\n  value       = ${tfType}.${name}.id\n}`
    })
    .filter((s): s is string => Boolean(s))

  const customOutputs = nodes
    .filter((n) => n.type === 'tf_output')
    .map((n) => {
      const outName = slugify(String(n.properties?.name || n.label || 'out'))
      const val = n.properties?.value || '""'
      return `output "${outName}" {\n  description = "User-defined output ${outName}"\n  value       = ${hclValue(val)}\n}`
    })

  const outputsTf =
    [...resourceOutputs, ...customOutputs].join('\n\n') + (resourceOutputs.length || customOutputs.length ? '\n' : '')

  const devopsFiles = generateDevOpsFiles(project)

  const resourceList = nodes
    .filter((n) => Boolean(resolveTfType(n)))
    .map((n) => `- \`${resolveTfType(n)}.${nameMap.get(n.id)}\` (${n.label})`)
    .join('\n')

  const readme = `# ${project.name}

${project.description ? `${project.description}\n\n` : ''}Generated by [Inkfra](https://github.com/hkbagh/Inkfra).

## Resources

${resourceList || '_No Terraform resources emitted._'}

## Usage

\`\`\`bash
terraform init
terraform fmt -check
terraform validate
terraform plan
terraform apply
\`\`\`
`

  const files: Record<string, string> = {}

  if (layout === 'single') {
    const header = `# Generated by Inkfra - Visual-to-IaC Canvas\n# Project: ${project.name}`
    const sections = [versionsTf, providersTf, localsBlock, ...dataBlocks, header, ...orderedBlocks]
    if (connLines.length) {
      sections.push('# --- Connections ---\n' + connLines.join('\n'))
    }
    files['main.tf'] = sections.filter(Boolean).join('\n\n') + '\n'
    files['variables.tf'] = variablesTf
    files['outputs.tf'] = outputsTf
    Object.assign(files, devopsFiles)
    files['README.md'] = readme
  } else {
    files['versions.tf'] = versionsTf + '\n'
    files['providers.tf'] = providersTf + '\n'
    files['locals.tf'] = localsBlock + '\n'
    if (dataBlocks.length > 0) {
      files['data.tf'] = dataBlocks.join('\n\n') + '\n'
    }
    for (const [catFile, catList] of Object.entries(categoryBlocks)) {
      if (catList.length === 0) continue
      files[catFile] = catList.join('\n\n') + '\n'
    }
    files['variables.tf'] = variablesTf
    files['outputs.tf'] = outputsTf
    Object.assign(files, buildRepoScaffolding(project))
    const bootstrap = buildBackendBootstrap(project)
    if (bootstrap) files['bootstrap/backend.tf'] = bootstrap
    Object.assign(files, devopsFiles)
    files['README.md'] = readme
  }

  return { files, warnings }
}
