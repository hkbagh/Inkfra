import { describe, expect, it } from 'vitest'
import { generateTerraform } from './terraform'
import type { Project } from '../types/ir'

function makeProject(partial: Partial<Project> = {}): Project {
  return {
    name: 'test-infra',
    provider: 'aws',
    nodes: [],
    edges: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  }
}

describe('generateTerraform', () => {
  it('wires EC2 instance references, security group blocks, ALB listener actions, and S3 companion resources in single mode', () => {
    const project = makeProject({
      exportLayout: 'single',
      nodes: [
        {
          id: 'vpc1',
          type: 'aws_vpc',
          label: 'main-vpc',
          provider: 'aws',
          x: 0,
          y: 0,
          properties: { name: 'main-vpc', cidr_block: '10.0.0.0/16' },
        },
        {
          id: 'sub1',
          type: 'aws_subnet',
          label: 'public-subnet',
          provider: 'aws',
          x: 100,
          y: 100,
          properties: { name: 'public-subnet', cidr_block: '10.0.1.0/24', map_public_ip_on_launch: true },
        },
        {
          id: 'sg1',
          type: 'aws_security_group',
          label: 'web-sg',
          provider: 'aws',
          x: 200,
          y: 100,
          properties: {
            name: 'web-sg',
            description: 'Web tier security group',
            ingress: 'tcp 443 0.0.0.0/0, tcp 8080 10.0.0.0/16',
            egress: '-1 0 0.0.0.0/0',
          },
        },
        {
          id: 'ec2',
          type: 'aws_ec2_instance',
          label: 'app-server',
          provider: 'aws',
          x: 300,
          y: 100,
          properties: {
            name: 'app-server',
            ami: 'ami-0c55b159cbfafe1f0',
            instance_type: 't3.micro',
            root_volume_size: 40,
          },
        },
        {
          id: 'alb',
          type: 'aws_lb',
          label: 'edge-alb',
          provider: 'aws',
          x: 150,
          y: 0,
          properties: { name: 'edge-alb', internal: false, load_balancer_type: 'application' },
        },
        {
          id: 'tg1',
          type: 'aws_lb_target_group',
          label: 'app-tg',
          provider: 'aws',
          x: 250,
          y: 0,
          properties: { name: 'app-tg', port: 8080, protocol: 'HTTP' },
        },
        {
          id: 'lst1',
          type: 'aws_lb_listener',
          label: 'https-listener',
          provider: 'aws',
          x: 200,
          y: 40,
          properties: { port: 443, protocol: 'HTTPS' },
        },
        {
          id: 's3',
          type: 'aws_s3_bucket',
          label: 'media-bucket',
          provider: 'aws',
          x: 400,
          y: 100,
          properties: { bucket: 'my-media-bucket', acl: 'private', versioning: true },
        },
      ],
      edges: [
        { id: 'e1', source: 'sub1', target: 'vpc1', kind: 'contains' },
        { id: 'e2', source: 'sg1', target: 'vpc1', kind: 'contains' },
        { id: 'e3', source: 'ec2', target: 'sub1', kind: 'contains' },
        { id: 'e4', source: 'ec2', target: 'sg1', kind: 'connects' },
        { id: 'e5', source: 'alb', target: 'sub1', kind: 'connects' },
        { id: 'e6', source: 'lst1', target: 'alb', kind: 'contains' },
        { id: 'e7', source: 'lst1', target: 'tg1', kind: 'routes_to' },
        { id: 'e8', source: 'tg1', target: 'vpc1', kind: 'contains' },
        { id: 'e9', source: 'tg1', target: 'ec2', kind: 'routes_to' },
      ],
    })

    const { files } = generateTerraform(project)
    const main = files['main.tf']

    expect(main).toContain('resource "aws_instance" "app_server"')
    expect(main).toContain('subnet_id              = aws_subnet.public_subnet.id')
    expect(main).toContain('vpc_security_group_ids = [aws_security_group.web_sg.id]')
    expect(main).toContain('encrypted   = true')
    expect(main).toContain('http_tokens   = "required"')

    expect(main).toContain('resource "aws_security_group" "web_sg"')
    expect(main).toContain('from_port   = 443')
    expect(main).toContain('from_port   = 8080')
    expect(main).toContain('protocol    = "-1"')

    expect(main).toContain('resource "aws_lb_target_group_attachment" "app_tg_app_server"')
    expect(main).toContain('target_group_arn = aws_lb_target_group.app_tg.arn')

    expect(main).toContain('resource "aws_s3_bucket_versioning" "media_bucket_versioning"')
    expect(main).toContain('resource "aws_s3_bucket_server_side_encryption_configuration" "media_bucket_sse"')
    expect(main).toContain('resource "aws_s3_bucket_public_access_block" "media_bucket_public_access"')
    expect(main).not.toMatch(/^\s+acl\s*=/m)

    expect(files['variables.tf']).toContain('description =')
    expect(files['outputs.tf']).toContain('description =')
  })

  it('generates structured Azure, GCP, Docker, Kubernetes, and Terraform meta blocks', () => {
    const project = makeProject({
      provider: 'multi',
      exportLayout: 'single',
      nodes: [
        {
          id: 'rg1',
          type: 'azurerm_resource_group',
          label: 'core-rg',
          provider: 'azure',
          x: 0,
          y: 0,
          properties: { name: 'core-rg', location: 'eastus' },
        },
        {
          id: 'vnet1',
          type: 'azurerm_virtual_network',
          label: 'core-vnet',
          provider: 'azure',
          x: 100,
          y: 0,
          properties: { name: 'core-vnet', address_space: '10.1.0.0/16' },
        },
        {
          id: 'vm1',
          type: 'azurerm_virtual_machine',
          label: 'app-vm',
          provider: 'azure',
          x: 150,
          y: 0,
          properties: { name: 'app-vm', size: 'Standard_B1s', admin_username: 'azureuser', location: 'eastus' },
        },
        {
          id: 'fw1',
          type: 'google_compute_firewall',
          label: 'allow-web',
          provider: 'gcp',
          x: 200,
          y: 0,
          properties: { name: 'allow-web', allowed: 'tcp:80,443', source_ranges: '0.0.0.0/0' },
        },
        {
          id: 'gce1',
          type: 'google_compute_instance',
          label: 'gce-vm',
          provider: 'gcp',
          x: 250,
          y: 0,
          properties: { name: 'gce-vm', machine_type: 'e2-medium', zone: 'us-central1-a' },
        },
        {
          id: 'img1',
          type: 'docker_image',
          label: 'api-img',
          provider: 'docker',
          x: 300,
          y: 0,
          properties: { name: 'nginx:alpine', keep_locally: true },
        },
        {
          id: 'ctr1',
          type: 'docker_container',
          label: 'api-ctr',
          provider: 'docker',
          x: 400,
          y: 0,
          properties: { name: 'api', ports_internal: 80, ports_external: 8080 },
        },
        {
          id: 'k8s1',
          type: 'k8s_deployment',
          label: 'web-deploy',
          provider: 'kubernetes',
          x: 500,
          y: 0,
          properties: { name: 'web', namespace: 'prod', replicas: 3, image: 'nginx:1.27', port: 80 },
        },
        {
          id: 'var1',
          type: 'tf_variable',
          label: 'app-port',
          provider: 'terraform',
          x: 0,
          y: 200,
          properties: { name: 'app_port', type: 'number', default: '8080' },
        },
        {
          id: 'out1',
          type: 'tf_output',
          label: 'api-url',
          provider: 'terraform',
          x: 100,
          y: 200,
          properties: { name: 'api_url', value: 'https://api.example.com', sensitive: false },
        },
        {
          id: 'be1',
          type: 'tf_backend',
          label: 's3-state',
          provider: 'terraform',
          x: 200,
          y: 200,
          properties: { type: 's3', bucket: 'tf-state-bucket', key: 'prod/terraform.tfstate', region: 'us-east-1', encrypt: true },
        },
        {
          id: 'mod1',
          type: 'tf_module_call',
          label: 'vpc-mod',
          provider: 'terraform',
          x: 300,
          y: 200,
          properties: { name: 'network', source: 'terraform-aws-modules/vpc/aws', version: '~> 5.0' },
        },
      ],
      edges: [
        { id: 'az1', source: 'vnet1', target: 'rg1', kind: 'contains' },
        { id: 'az2', source: 'vm1', target: 'rg1', kind: 'contains' },
        { id: 'dk1', source: 'ctr1', target: 'img1', kind: 'connects' },
      ],
    })

    const { files } = generateTerraform(project)
    const main = files['main.tf']

    expect(main).toContain('backend "s3"')
    expect(main).toContain('bucket  = "tf-state-bucket"')
    expect(main).toContain('resource_group_name = azurerm_resource_group.core_rg.name')
    expect(main).toContain('azurerm_network_interface')
    expect(main).toContain('os_disk {')
    expect(main).toContain('boot_disk {')
    expect(main).toContain('resource "google_compute_firewall" "allow_web"')
    expect(main).toContain('ports    = ["80", "443"]')
    expect(main).toContain('image = docker_image.api_img.image_id')
    expect(main).toContain('resource "kubernetes_deployment" "web_deploy"')
    expect(main).toContain('module "vpc_mod"')

    expect(files['variables.tf']).toContain('variable "app_port"')
    expect(files['variables.tf']).toContain('sensitive   = true')
    expect(files['outputs.tf']).toContain('output "api_url"')
  })

  it('generates modular DevOps repository files with AWS glue, secrets hygiene, and scaffolding by default', () => {
    const project = makeProject({
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
          label: 'pub-a',
          provider: 'aws',
          x: 100,
          y: 0,
          properties: { name: 'pub-a', cidr_block: '10.0.1.0/24' },
        },
        {
          id: 'nat1',
          type: 'aws_nat_gateway',
          label: 'nat-gw',
          provider: 'aws',
          x: 200,
          y: 0,
          properties: { name: 'nat-gw', connectivity_type: 'public' },
        },
        {
          id: 'rt1',
          type: 'aws_route_table',
          label: 'priv-rt',
          provider: 'aws',
          x: 250,
          y: 0,
          properties: { name: 'priv-rt' },
        },
        {
          id: 'ec2',
          type: 'aws_ec2_instance',
          label: 'web',
          provider: 'aws',
          x: 300,
          y: 0,
          properties: { name: 'web', ami: 'auto', instance_type: 't3.micro' },
        },
        {
          id: 'rds',
          type: 'aws_rds_instance',
          label: 'app-db',
          provider: 'aws',
          x: 400,
          y: 0,
          properties: { engine: 'postgres', instance_class: 'db.t3.micro', allocated_storage: 20, username: 'admin', password: 'plaintext-should-be-stripped' },
        },
        {
          id: 'be',
          type: 'tf_backend',
          label: 'state',
          provider: 'terraform',
          x: 0,
          y: 200,
          properties: { type: 's3', bucket: 'prod-state', key: 'app/terraform.tfstate', region: 'us-east-1', encrypt: true },
        },
      ],
      edges: [
        { id: 'e1', source: 'sub1', target: 'vpc1', kind: 'contains' },
        { id: 'e2', source: 'nat1', target: 'sub1', kind: 'contains' },
        { id: 'e3', source: 'rt1', target: 'vpc1', kind: 'contains' },
        { id: 'e4', source: 'rt1', target: 'sub1', kind: 'connects' },
        { id: 'e5', source: 'rt1', target: 'nat1', kind: 'routes_to' },
        { id: 'e6', source: 'ec2', target: 'sub1', kind: 'contains' },
        { id: 'e7', source: 'rds', target: 'sub1', kind: 'contains' },
      ],
    })

    const { files } = generateTerraform(project)

    expect(files['versions.tf']).toContain('bucket  = "prod-state"')
    expect(files['providers.tf']).toContain('provider "aws"')
    expect(files['locals.tf']).toContain('common_tags')
    expect(files['data.tf']).toContain('data "aws_ami" "amazon_linux"')
    expect(files['network.tf']).toContain('resource "aws_eip" "nat_gw_eip"')
    expect(files['network.tf']).toContain('resource "aws_route_table_association"')
    expect(files['network.tf']).toContain('resource "aws_route" "priv_rt_nat"')
    expect(files['compute.tf']).toContain('ami           = data.aws_ami.amazon_linux.id')
    expect(files['database.tf']).toContain('resource "aws_db_subnet_group"')
    expect(files['database.tf']).not.toContain('plaintext-should-be-stripped')
    expect(files['database.tf']).toContain('password             = var.app_db_password')
    expect(files['variables.tf']).toContain('sensitive   = true')
    expect(files['bootstrap/backend.tf']).toContain('resource "aws_s3_bucket" "tf_state"')
    expect(files['environments/prod/terraform.tfvars']).toContain('environment = "prod"')
    expect(files['Makefile']).toContain('validate:')
    expect(files['.gitignore']).toContain('*.tfstate')
  })
})
