import type { InfraNode, Project } from '../types/ir'
import { slugify } from './hcl'

export const DEVOPS_ARTIFACT_TYPES = new Set([
  'devops_github_actions',
  'devops_gitlab_ci',
  'devops_jenkins',
  'devops_argocd_app',
  'devops_ansible_playbook',
  'obs_prometheus',
  'obs_grafana',
  'obs_datadog',
  'obs_elk',
  'sec_cert_manager',
  'net_nginx',
  'net_haproxy',
  'msg_rabbitmq',
  'msg_kafka',
  'db_postgres',
  'db_mysql',
  'db_redis',
  'db_mongodb',
])

const COMPOSE_SERVICE_TYPES = new Set([
  'docker_container',
  'obs_prometheus',
  'obs_grafana',
  'net_nginx',
  'net_haproxy',
  'msg_rabbitmq',
  'msg_kafka',
  'db_postgres',
  'db_mysql',
  'db_redis',
  'db_mongodb',
])

function safePath(raw: unknown, fallback: string): string {
  const val = typeof raw === 'string' && raw.trim() ? raw.trim() : fallback
  return val.replace(/^\/+/, '')
}

function getConnectedNodes(project: Project, nodeId: string): InfraNode[] {
  const peerIds = new Set<string>()
  for (const e of project.edges) {
    if (e.source === nodeId) peerIds.add(e.target)
    else if (e.target === nodeId) peerIds.add(e.source)
  }
  return project.nodes.filter((n) => peerIds.has(n.id))
}

function buildGithubWorkflow(project: Project, node: InfraNode): { path: string; content: string } {
  const path = safePath(node.properties?.workflow, '.github/workflows/infra.yml')
  const branch = String(node.properties?.deploy_branch || 'main')
  const useOidc = String(node.properties?.provider_auth || 'oidc') !== 'static-keys'

  const hasAws =
    project.provider === 'aws' || project.provider === 'multi' || project.nodes.some((n) => n.provider === 'aws')
  const hasAzure =
    project.provider === 'azure' || project.provider === 'multi' || project.nodes.some((n) => n.provider === 'azure')
  const hasGcp =
    project.provider === 'gcp' || project.provider === 'multi' || project.nodes.some((n) => n.provider === 'gcp')

  const authSteps: string[] = []
  if (hasAws) {
    authSteps.push(
      useOidc
        ? `      - name: Configure AWS credentials (OIDC)\n        uses: aws-actions/configure-aws-credentials@v4\n        with:\n          role-to-assume: \${{ secrets.AWS_ROLE_TO_ASSUME }}\n          aws-region: \${{ vars.AWS_REGION || 'us-east-1' }}`
        : `      - name: Configure AWS credentials\n        uses: aws-actions/configure-aws-credentials@v4\n        with:\n          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}\n          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}\n          aws-region: \${{ vars.AWS_REGION || 'us-east-1' }}`,
    )
  }
  if (hasAzure) {
    authSteps.push(
      useOidc
        ? `      - name: Azure Login (OIDC)\n        uses: azure/login@v2\n        with:\n          client-id: \${{ secrets.AZURE_CLIENT_ID }}\n          tenant-id: \${{ secrets.AZURE_TENANT_ID }}\n          subscription-id: \${{ secrets.AZURE_SUBSCRIPTION_ID }}`
        : `      - name: Azure Login\n        uses: azure/login@v2\n        with:\n          creds: \${{ secrets.AZURE_CREDENTIALS }}`,
    )
  }
  if (hasGcp) {
    authSteps.push(
      useOidc
        ? `      - name: Authenticate to Google Cloud (WIF)\n        uses: google-github-actions/auth@v2\n        with:\n          workload_identity_provider: \${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}\n          service_account: \${{ secrets.GCP_SERVICE_ACCOUNT }}`
        : `      - name: Authenticate to Google Cloud\n        uses: google-github-actions/auth@v2\n        with:\n          credentials_json: \${{ secrets.GCP_SA_KEY }}`,
    )
  }

  const permsBlock = useOidc
    ? `permissions:\n  contents: read\n  id-token: write\n  pull-requests: write\n`
    : `permissions:\n  contents: read\n  pull-requests: write\n`

  const content = `name: Infrastructure Delivery (${project.name || 'inkfra'})

on:
  push:
    branches: [${branch}]
  pull_request:
  workflow_dispatch:

${permsBlock}
jobs:
  validate-and-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.9.0

      - name: Terraform Format Check
        run: terraform fmt -check -recursive

      - name: Terraform Init & Validate
        run: |
          terraform init -backend=false
          terraform validate

      - name: Setup TFLint
        uses: terraform-linters/setup-tflint@v4

      - name: Run TFLint
        run: |
          tflint --init
          tflint -f compact

      - name: Run Trivy IaC Security Scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: config
          scan-ref: .
          exit-code: '1'
          severity: CRITICAL,HIGH

  plan-and-apply:
    needs: validate-and-scan
    runs-on: ubuntu-latest
    environment: \${{ github.ref == 'refs/heads/${branch}' && 'production' || 'staging' }}
    steps:
      - uses: actions/checkout@v4
${authSteps.length ? authSteps.join('\n\n') + '\n' : ''}
      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.9.0

      - name: Terraform Init
        run: terraform init

      - name: Terraform Plan
        run: terraform plan -no-color -out=tfplan

      - name: Terraform Apply
        if: github.ref == 'refs/heads/${branch}' && github.event_name != 'pull_request'
        run: terraform apply -auto-approve tfplan
`
  return { path, content }
}

function buildGitlabCi(project: Project, node: InfraNode): { path: string; content: string } {
  const path = safePath(node.properties?.config, '.gitlab-ci.yml')
  const branch = String(node.properties?.deploy_branch || 'main')
  const useOidc = String(node.properties?.provider_auth || 'oidc') !== 'static-keys'

  const idTokens = useOidc
    ? `  id_tokens:\n    CLOUD_OIDC_TOKEN:\n      aud: https://gitlab.com\n`
    : ''

  const content = `# Generated by Inkfra for ${project.name || 'inkfra'}
image:
  name: hashicorp/terraform:1.9.0
  entrypoint: [""]

stages:
  - validate
  - security
  - plan
  - deploy

variables:
  TF_ROOT: .
  TF_IN_AUTOMATION: "true"

fmt_and_validate:
  stage: validate
  script:
    - terraform fmt -check -recursive
    - terraform init -backend=false
    - terraform validate

trivy_config:
  stage: security
  image:
    name: aquasec/trivy:latest
    entrypoint: [""]
  script:
    - trivy config --exit-code 1 --severity CRITICAL,HIGH .

plan:
  stage: plan
${idTokens}  script:
    - terraform init
    - terraform plan -out=tfplan
  artifacts:
    paths:
      - tfplan
    expire_in: 1 day

apply:
  stage: deploy
${idTokens}  needs: [plan]
  when: manual
  only:
    - ${branch}
  script:
    - terraform init
    - terraform apply -auto-approve tfplan
`
  return { path, content }
}

function buildJenkinsfile(project: Project, node: InfraNode): string {
  const job = String(node.properties?.job || 'infra-deploy')
  const branch = String(node.properties?.deploy_branch || 'main')
  return `// Generated by Inkfra (${project.name || 'inkfra'} / ${job})
pipeline {
  agent any

  options {
    disableConcurrentBuilds()
    timestamps()
  }

  stages {
    stage('Format & Validate') {
      steps {
        sh 'terraform fmt -check -recursive'
        sh 'terraform init -backend=false'
        sh 'terraform validate'
      }
    }

    stage('Security Scan') {
      steps {
        sh 'trivy config --exit-code 1 --severity CRITICAL,HIGH .'
      }
    }

    stage('Plan') {
      steps {
        sh 'terraform init'
        sh 'terraform plan -no-color -out=tfplan'
      }
    }

    stage('Approve & Apply') {
      when {
        branch '${branch}'
      }
      steps {
        input message: 'Approve Terraform apply to ${branch}?'
        sh 'terraform apply -auto-approve tfplan'
      }
    }
  }
}
`
}

function buildArgoCdApp(node: InfraNode): { path: string; content: string } {
  const appName = slugify(String(node.properties?.name || node.label || 'app')).replace(/_/g, '-')
  const repoUrl = String(node.properties?.repo_url || 'https://github.com/org/infra.git')
  const manifestPath = String(node.properties?.path || 'k8s')
  const ns = String(node.properties?.namespace || 'default')
  return {
    path: `gitops/argocd/${appName}.yaml`,
    content: `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ${appName}
  namespace: argocd
spec:
  project: default
  source:
    repoURL: ${repoUrl}
    targetRevision: HEAD
    path: ${manifestPath}
  destination:
    server: https://kubernetes.default.svc
    namespace: ${ns}
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
`,
  }
}

function buildKubernetesManifests(project: Project): Record<string, string> {
  const files: Record<string, string> = {}
  const resources: string[] = []

  for (const n of project.nodes) {
    const k8sName = slugify(String(n.properties?.name || n.label || n.id)).replace(/_/g, '-')
    const ns = String(n.properties?.namespace || 'default')

    if (n.type === 'k8s_deployment') {
      const replicas = Number(n.properties?.replicas) || 2
      const image = String(n.properties?.image || 'nginx:latest')
      const port = Number(n.properties?.port) || 80
      const file = `k8s/${k8sName}-deployment.yaml`
      resources.push(`${k8sName}-deployment.yaml`)
      files[file] = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${k8sName}
  namespace: ${ns}
spec:
  replicas: ${replicas}
  selector:
    matchLabels:
      app: ${k8sName}
  template:
    metadata:
      labels:
        app: ${k8sName}
    spec:
      securityContext:
        runAsNonRoot: true
      containers:
        - name: ${k8sName}
          image: ${image}
          ports:
            - containerPort: ${port}
`
    } else if (n.type === 'k8s_service') {
      const svcType = String(n.properties?.type || 'ClusterIP')
      const port = Number(n.properties?.port) || 80
      const targetPort = Number(n.properties?.target_port) || port
      const file = `k8s/${k8sName}-service.yaml`
      resources.push(`${k8sName}-service.yaml`)
      files[file] = `apiVersion: v1
kind: Service
metadata:
  name: ${k8sName}
  namespace: ${ns}
spec:
  type: ${svcType}
  selector:
    app: ${k8sName}
  ports:
    - port: ${port}
      targetPort: ${targetPort}
`
    } else if (n.type === 'sec_cert_manager') {
      const file = `k8s/cluster-issuer.yaml`
      resources.push('cluster-issuer.yaml')
      files[file] = `apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: platform-team@example.com
    privateKeySecretRef:
      name: letsencrypt-prod-key
    solvers:
      - http01:
          ingress:
            class: nginx
`
    }
  }

  if (resources.length > 0) {
    files['k8s/kustomization.yaml'] = `apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
${resources.map((r) => `  - ${r}`).join('\n')}
`
  }

  return files
}

function buildComposeAndRuntime(project: Project): Record<string, string> {
  const files: Record<string, string> = {}
  const runtimeNodes = project.nodes.filter((n) => COMPOSE_SERVICE_TYPES.has(n.type))
  if (runtimeNodes.length === 0) return files

  const imageMap = new Map<string, string>()
  for (const n of project.nodes) {
    if (n.type === 'docker_image') {
      imageMap.set(n.id, String(n.properties?.name || 'nginx:alpine'))
    }
  }

  const serviceLines: string[] = []
  const volumeNames = new Set<string>()

  for (const n of runtimeNodes) {
    const svcName = slugify(String(n.properties?.name || n.label || n.id)).replace(/_/g, '-')
    const peers = getConnectedNodes(project, n.id)
    const depServices = peers
      .filter((p) => COMPOSE_SERVICE_TYPES.has(p.type) && p.id !== n.id)
      .map((p) => slugify(String(p.properties?.name || p.label || p.id)).replace(/_/g, '-'))

    let image = 'nginx:alpine'
    const ports: string[] = []
    const env: string[] = []
    const vols: string[] = []

    if (n.type === 'docker_container') {
      const linkedImg = peers.find((p) => p.type === 'docker_image')
      image = linkedImg ? imageMap.get(linkedImg.id) || 'nginx:alpine' : String(n.properties?.image || 'nginx:alpine')
      const ext = Number(n.properties?.ports_external) || 8080
      const intPort = Number(n.properties?.ports_internal) || 80
      ports.push(`${ext}:${intPort}`)
    } else if (n.type === 'db_postgres') {
      image = `postgres:${String(n.properties?.version || '15')}-alpine`
      const port = Number(n.properties?.port) || 5432
      ports.push(`${port}:5432`)
      env.push('POSTGRES_USER=app', 'POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-changeme}', 'POSTGRES_DB=appdb')
      volumeNames.add('postgres_data')
      vols.push('postgres_data:/var/lib/postgresql/data')
    } else if (n.type === 'db_mysql') {
      image = `mysql:${String(n.properties?.version || '8.0')}`
      const port = Number(n.properties?.port) || 3306
      ports.push(`${port}:3306`)
      env.push('MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-changeme}', 'MYSQL_DATABASE=appdb')
      volumeNames.add('mysql_data')
      vols.push('mysql_data:/var/lib/mysql')
    } else if (n.type === 'db_redis') {
      image = 'redis:7-alpine'
      const port = Number(n.properties?.port) || 6379
      ports.push(`${port}:6379`)
    } else if (n.type === 'db_mongodb') {
      image = 'mongo:7'
      const port = Number(n.properties?.port) || 27017
      ports.push(`${port}:27017`)
      volumeNames.add('mongo_data')
      vols.push('mongo_data:/data/db')
    } else if (n.type === 'msg_rabbitmq') {
      image = 'rabbitmq:3-management-alpine'
      ports.push('5672:5672', '15672:15672')
    } else if (n.type === 'msg_kafka') {
      image = 'bitnami/kafka:latest'
      ports.push('9092:9092')
      env.push(
        'KAFKA_CFG_NODE_ID=0',
        'KAFKA_CFG_PROCESS_ROLES=controller,broker',
        'KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093',
      )
    } else if (n.type === 'net_nginx') {
      image = 'nginx:1.27-alpine'
      ports.push('80:80', '443:443')
      vols.push('./nginx/nginx.conf:/etc/nginx/nginx.conf:ro')
    } else if (n.type === 'net_haproxy') {
      image = 'haproxy:3.0-alpine'
      ports.push('80:80')
    } else if (n.type === 'obs_prometheus') {
      image = 'prom/prometheus:latest'
      ports.push('9090:9090')
      vols.push('./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro')
    } else if (n.type === 'obs_grafana') {
      image = 'grafana/grafana:latest'
      ports.push('3000:3000')
      env.push(`GF_SECURITY_ADMIN_USER=${String(n.properties?.admin_user || 'admin')}`, 'GF_SECURITY_ADMIN_PASSWORD=${GF_ADMIN_PASSWORD:-changeme}')
      vols.push('./monitoring/grafana/provisioning:/etc/grafana/provisioning:ro')
    }

    const block: string[] = [`  ${svcName}:`, `    image: ${image}`, `    restart: unless-stopped`]
    if (ports.length) {
      block.push('    ports:', ...ports.map((p) => `      - "${p}"`))
    }
    if (env.length) {
      block.push('    environment:', ...env.map((e) => `      - ${e}`))
    }
    if (vols.length) {
      block.push('    volumes:', ...vols.map((v) => `      - ${v}`))
    }
    if (depServices.length) {
      block.push('    depends_on:', ...depServices.map((d) => `      - ${d}`))
    }
    serviceLines.push(block.join('\n'))
  }

  let compose = `services:\n${serviceLines.join('\n\n')}\n`
  if (volumeNames.size > 0) {
    compose += `\nvolumes:\n${Array.from(volumeNames)
      .map((v) => `  ${v}:`)
      .join('\n')}\n`
  }
  files['docker-compose.yml'] = compose

  const promNode = runtimeNodes.find((n) => n.type === 'obs_prometheus')
  if (promNode) {
    const scrapeInterval = String(promNode.properties?.scrape_interval || '15s')
    const scrapeTargets = getConnectedNodes(project, promNode.id)
      .filter((p) => p.type !== 'obs_grafana')
      .map((p) => {
        const svc = slugify(String(p.properties?.name || p.label || p.id)).replace(/_/g, '-')
        const port = Number(p.properties?.ports_internal || p.properties?.port || 9100)
        return `${svc}:${port}`
      })
    files['monitoring/prometheus.yml'] = `global:
  scrape_interval: ${scrapeInterval}

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ["localhost:9090"]
${
  scrapeTargets.length
    ? `
  - job_name: services
    static_configs:
      - targets: [${scrapeTargets.map((t) => `"${t}"`).join(', ')}]
`
    : ''
}`
  }

  if (runtimeNodes.some((n) => n.type === 'obs_grafana')) {
    files['monitoring/grafana/provisioning/datasources/prometheus.yml'] = `apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
`
  }

  const nginxNode = runtimeNodes.find((n) => n.type === 'net_nginx')
  if (nginxNode) {
    const workers = Number(nginxNode.properties?.worker_processes) || 4
    const backendNode = getConnectedNodes(project, nginxNode.id).find(
      (p) => p.type === 'docker_container' || p.type === 'aws_ec2_instance' || p.type === 'generic_server',
    )
    const backendHost = backendNode
      ? slugify(String(backendNode.properties?.name || backendNode.label || backendNode.id)).replace(/_/g, '-')
      : 'app'
    const backendPort = Number(backendNode?.properties?.ports_internal || backendNode?.properties?.port || 8080)
    files['nginx/nginx.conf'] = `worker_processes ${workers};

events {
  worker_connections 1024;
}

http {
  upstream backend_upstream {
    server ${backendHost}:${backendPort};
  }

  server {
    listen 80;

    location / {
      proxy_pass http://backend_upstream;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
  }
}
`
  }

  return files
}

function buildAnsibleFiles(project: Project, node: InfraNode): Record<string, string> {
  const playbookName = safePath(node.properties?.playbook, 'site.yml').replace(/^ansible\//, '')
  const hosts = project.nodes
    .filter(
      (n) =>
        n.type === 'aws_ec2_instance' ||
        n.type === 'azurerm_virtual_machine' ||
        n.type === 'google_compute_instance' ||
        n.type === 'generic_server',
    )
    .map((n) => slugify(String(n.properties?.name || n.label || n.id)).replace(/_/g, '-'))

  const invHosts = hosts.length ? hosts : ['app-01']
  return {
    [`ansible/${playbookName}`]: `---
- name: Configure ${project.name || 'infrastructure'} hosts
  hosts: app_servers
  become: true
  tasks:
    - name: Ensure baseline packages are installed
      ansible.builtin.package:
        name:
          - curl
          - ca-certificates
        state: present
`,
    'ansible/inventory.ini': `[app_servers]
${invHosts.map((h) => `${h} ansible_user=ubuntu`).join('\n')}
`,
  }
}

export function generateDevOpsFiles(project: Project): Record<string, string> {
  const files: Record<string, string> = {}

  for (const n of project.nodes) {
    if (n.type === 'devops_github_actions') {
      const wf = buildGithubWorkflow(project, n)
      files[wf.path] = wf.content
    } else if (n.type === 'devops_gitlab_ci') {
      const ci = buildGitlabCi(project, n)
      files[ci.path] = ci.content
    } else if (n.type === 'devops_jenkins') {
      files['Jenkinsfile'] = buildJenkinsfile(project, n)
    } else if (n.type === 'devops_argocd_app') {
      const app = buildArgoCdApp(n)
      files[app.path] = app.content
    } else if (n.type === 'devops_ansible_playbook') {
      Object.assign(files, buildAnsibleFiles(project, n))
    }
  }

  Object.assign(files, buildKubernetesManifests(project))
  Object.assign(files, buildComposeAndRuntime(project))

  return files
}

