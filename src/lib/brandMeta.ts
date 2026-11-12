export interface BrandDisplayMeta {
  label: string
  shortLabel: string
  color: string
}

export const PROVIDER_META: Record<string, BrandDisplayMeta> = {
  aws: { label: 'Amazon Web Services', shortLabel: 'AWS', color: '#FF9900' },
  azure: { label: 'Microsoft Azure', shortLabel: 'Azure', color: '#0078D4' },
  gcp: { label: 'Google Cloud', shortLabel: 'GCP', color: '#4285F4' },
  multi: { label: 'Multi-cloud', shortLabel: 'Multi', color: '#8B5CF6' },
  kubernetes: { label: 'Kubernetes', shortLabel: 'K8s', color: '#326CE5' },
  docker: { label: 'Docker', shortLabel: 'Docker', color: '#2496ED' },
  terraform: { label: 'HashiCorp Terraform', shortLabel: 'Terraform', color: '#7B42BC' },
  devops: { label: 'DevOps & Tools', shortLabel: 'DevOps', color: '#38BDF8' },
  generic: { label: 'Generic Blueprint', shortLabel: 'Generic', color: '#94A3B8' },
}

export const BRANDED_RESOURCE_TYPES = new Set([
  'devops_github_actions',
  'devops_gitlab_ci',
  'devops_jenkins',
  'devops_argocd_app',
  'devops_terraform_module',
  'devops_ansible_playbook',
  'devops_helm_release',
  'obs_prometheus',
  'obs_grafana',
  'obs_datadog',
  'sec_vault',
  'net_nginx',
  'msg_rabbitmq',
  'msg_kafka',
  'db_postgres',
  'db_mysql',
  'db_redis',
  'db_mongodb',
])

export function getProviderMeta(provider: string): BrandDisplayMeta {
  return PROVIDER_META[provider] ?? { label: provider, shortLabel: provider, color: '#94A3B8' }
}

