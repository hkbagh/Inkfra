import type { Project } from '../types/ir'
import { parseProject } from '../lib/project'
import awsBasicRaw from '../../examples/aws-basic.inkfra.json'
import threeTierRaw from '../../examples/three-tier-webapp.inkfra.json'
import eksPlatformRaw from '../../examples/eks-production-platform.inkfra.json'
import awsServerlessEdgeRaw from '../../examples/aws-serverless-edge.inkfra.json'
import azureAksRaw from '../../examples/azure-aks-enterprise.inkfra.json'
import gcpCloudRunRaw from '../../examples/gcp-cloud-run-platform.inkfra.json'
import k8sGitopsRaw from '../../examples/k8s-gitops-microservices.inkfra.json'
import dockerObsRaw from '../../examples/docker-observability-stack.inkfra.json'

export type ExampleStackFilter = 'aws' | 'azure' | 'gcp' | 'devops'

export interface ExampleProject {
  id: string
  name: string
  description: string
  icon: string
  badge?: string
  stack: ExampleStackFilter
  highlights: string[]
  project: Project
}

function requireExample(raw: unknown, id: string): Project {
  const project = parseProject(raw)
  if (!project) throw new Error(`Invalid example project: ${id}`)
  return project
}

export const EXAMPLES: ExampleProject[] = [
  {
    id: 'eks-production-platform',
    name: 'EKS Production Platform',
    description:
      'Multi-AZ AWS VPC with IGW, NAT Gateway + EIP, Route Table, EKS Cluster, encrypted RDS, S3 remote state backend, and GitHub Actions OIDC CI/CD.',
    icon: 'Boxes',
    badge: 'Production AWS',
    stack: 'aws',
    highlights: ['Modular .tf', 'EKS', 'NAT + RT', 'S3 State', 'GitHub OIDC'],
    project: requireExample(eksPlatformRaw, 'eks-production-platform'),
  },
  {
    id: 'aws-serverless-edge',
    name: 'AWS Serverless Edge API',
    description:
      'Global edge API with CloudFront CDN, private versioned S3 origin, Cognito auth, API Gateway, Lambda, DynamoDB, FIFO SQS, SNS alerts, and OIDC CI.',
    icon: 'Zap',
    badge: 'Serverless + CDN',
    stack: 'aws',
    highlights: ['CloudFront', 'API Gateway', 'Lambda', 'DynamoDB', 'SQS FIFO'],
    project: requireExample(awsServerlessEdgeRaw, 'aws-serverless-edge'),
  },
  {
    id: 'azure-aks-enterprise',
    name: 'Azure AKS Zero-Trust Platform',
    description:
      'Enterprise Azure stack with Resource Group, VNet subnets, NSG, SystemAssigned AKS cluster, Premium ACR, Key Vault, Azure SQL, GRS Storage, and azurerm state.',
    icon: 'Shield',
    badge: 'Enterprise Azure',
    stack: 'azure',
    highlights: ['AKS', 'ACR', 'Key Vault', 'Azure SQL', 'azurerm State'],
    project: requireExample(azureAksRaw, 'azure-aks-enterprise'),
  },
  {
    id: 'gcp-cloud-run-platform',
    name: 'GCP Cloud Run & Cloud SQL',
    description:
      'Cloud-native Google Cloud stack with custom VPC, private subnetwork, scoped firewall, Cloud Run, Cloud SQL Postgres 15, Pub/Sub, GCS bucket, and GCS backend.',
    icon: 'Cloud',
    badge: 'Cloud-Native GCP',
    stack: 'gcp',
    highlights: ['Cloud Run', 'Cloud SQL', 'VPC + FW', 'Pub/Sub', 'GCS State'],
    project: requireExample(gcpCloudRunRaw, 'gcp-cloud-run-platform'),
  },
  {
    id: 'k8s-gitops-microservices',
    name: 'Kubernetes GitOps Platform',
    description:
      'Complete Kubernetes & GitOps bundle exporting Terraform kubernetes_* manifests, Kustomize YAML, cert-manager ClusterIssuer, ArgoCD App, and Prometheus/Grafana.',
    icon: 'Rocket',
    badge: 'K8s + ArgoCD',
    stack: 'devops',
    highlights: ['ArgoCD', 'Kustomize', 'cert-manager', 'HPA', 'Prometheus'],
    project: requireExample(k8sGitopsRaw, 'k8s-gitops-microservices'),
  },
  {
    id: 'three-tier-webapp',
    name: 'Three-Tier Web App',
    description:
      'Multi-AZ AWS web architecture with public and private subnets, Application Load Balancer, IMDSv2 EC2 web tier, encrypted RDS database, and S3 assets.',
    icon: 'Layers',
    stack: 'aws',
    highlights: ['VPC', 'ALB', 'EC2 IMDSv2', 'RDS', 'S3'],
    project: requireExample(threeTierRaw, 'three-tier-webapp'),
  },
  {
    id: 'docker-observability-stack',
    name: 'Container & Monitoring Stack',
    description:
      'End-to-end runtime DevOps bundle exporting Docker Compose, NGINX upstream config, Prometheus targets, Grafana provisioning, and GitLab CI.',
    icon: 'Activity',
    badge: 'Compose + CI',
    stack: 'devops',
    highlights: ['Docker Compose', 'NGINX', 'Prometheus', 'Grafana', 'GitLab CI'],
    project: requireExample(dockerObsRaw, 'docker-observability-stack'),
  },
  {
    id: 'aws-basic',
    name: 'AWS Starter Network',
    description:
      'Compact single-file VPC baseline with a public subnet, internet gateway, security group, EC2 instance, and private S3 bucket.',
    icon: 'Network',
    stack: 'aws',
    highlights: ['Single main.tf', 'VPC', 'Subnet', 'EC2', 'S3'],
    project: requireExample(awsBasicRaw, 'aws-basic'),
  },
]
