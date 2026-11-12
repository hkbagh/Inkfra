import { describe, expect, it } from 'vitest'
import { generateDevOpsFiles } from './devops'
import type { Project } from '../types/ir'

function makeProject(partial: Partial<Project> = {}): Project {
  return {
    name: 'devops-suite',
    provider: 'aws',
    nodes: [],
    edges: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  }
}

describe('generateDevOpsFiles', () => {
  it('generates GitHub Actions OIDC, GitLab CI, Jenkins, ArgoCD, and Ansible artifacts', () => {
    const project = makeProject({
      nodes: [
        {
          id: 'ec2',
          type: 'aws_ec2_instance',
          label: 'web-host',
          provider: 'aws',
          x: 0,
          y: 0,
          properties: { name: 'web-host' },
        },
        {
          id: 'gha',
          type: 'devops_github_actions',
          label: 'GitHub Actions',
          provider: 'devops',
          x: 100,
          y: 0,
          properties: { workflow: '.github/workflows/infra.yml', deploy_branch: 'main', provider_auth: 'oidc' },
        },
        {
          id: 'gl',
          type: 'devops_gitlab_ci',
          label: 'GitLab CI',
          provider: 'devops',
          x: 200,
          y: 0,
          properties: { config: '.gitlab-ci.yml', deploy_branch: 'main', provider_auth: 'oidc' },
        },
        {
          id: 'jk',
          type: 'devops_jenkins',
          label: 'Jenkins',
          provider: 'devops',
          x: 300,
          y: 0,
          properties: { job: 'infra', deploy_branch: 'main' },
        },
        {
          id: 'argo',
          type: 'devops_argocd_app',
          label: 'Argo App',
          provider: 'devops',
          x: 400,
          y: 0,
          properties: { name: 'payments', repo_url: 'https://github.com/org/platform.git', path: 'k8s' },
        },
        {
          id: 'ans',
          type: 'devops_ansible_playbook',
          label: 'Playbook',
          provider: 'devops',
          x: 500,
          y: 0,
          properties: { playbook: 'site.yml' },
        },
      ],
    })

    const files = generateDevOpsFiles(project)

    expect(files['.github/workflows/infra.yml']).toContain('id-token: write')
    expect(files['.github/workflows/infra.yml']).toContain('aws-actions/configure-aws-credentials@v4')
    expect(files['.gitlab-ci.yml']).toContain('CLOUD_OIDC_TOKEN')
    expect(files['Jenkinsfile']).toContain("stage('Approve & Apply')")
    expect(files['gitops/argocd/payments.yaml']).toContain('kind: Application')
    expect(files['ansible/site.yml']).toContain('hosts: app_servers')
    expect(files['ansible/inventory.ini']).toContain('web-host ansible_user=ubuntu')
  })

  it('generates Docker Compose, NGINX, Prometheus, Grafana, and Kustomize manifests', () => {
    const project = makeProject({
      provider: 'multi',
      nodes: [
        {
          id: 'nx',
          type: 'net_nginx',
          label: 'nginx',
          provider: 'devops',
          x: 0,
          y: 0,
          properties: { worker_processes: 2 },
        },
        {
          id: 'api',
          type: 'docker_container',
          label: 'api',
          provider: 'docker',
          x: 100,
          y: 0,
          properties: { name: 'api', image: 'node:20-alpine', ports_internal: 3000, ports_external: 3000 },
        },
        {
          id: 'prom',
          type: 'obs_prometheus',
          label: 'prom',
          provider: 'devops',
          x: 200,
          y: 0,
          properties: { scrape_interval: '10s' },
        },
        {
          id: 'graf',
          type: 'obs_grafana',
          label: 'grafana',
          provider: 'devops',
          x: 300,
          y: 0,
          properties: { admin_user: 'ops' },
        },
        {
          id: 'dep',
          type: 'k8s_deployment',
          label: 'api-deploy',
          provider: 'kubernetes',
          x: 400,
          y: 0,
          properties: { name: 'api', replicas: 2, image: 'ghcr.io/org/api:v1', port: 8080 },
        },
      ],
      edges: [
        { id: 'e1', source: 'nx', target: 'api', kind: 'routes_to' },
        { id: 'e2', source: 'prom', target: 'api', kind: 'connects' },
      ],
    })

    const files = generateDevOpsFiles(project)

    expect(files['docker-compose.yml']).toContain('services:')
    expect(files['docker-compose.yml']).toContain('node:20-alpine')
    expect(files['nginx/nginx.conf']).toContain('server api:3000;')
    expect(files['monitoring/prometheus.yml']).toContain('scrape_interval: 10s')
    expect(files['monitoring/prometheus.yml']).toContain('"api:3000"')
    expect(files['monitoring/grafana/provisioning/datasources/prometheus.yml']).toContain('http://prometheus:9090')
    expect(files['k8s/kustomization.yaml']).toContain('api-deployment.yaml')
  })
})

