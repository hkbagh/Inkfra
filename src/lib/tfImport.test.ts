import { describe, expect, it } from 'vitest'
import { parseTerraformToProject } from './tfImport'
import { generateTerraform } from './terraform'

describe('parseTerraformToProject', () => {
  it('parses Terraform resources, modules, variables, backend, and inferred references', () => {
    const hcl = `
terraform {
  required_version = ">= 1.5.0"
  backend "s3" {
    bucket = "state-bucket"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}

resource "aws_vpc" "core" {
  cidr_block = "10.10.0.0/16"
}

resource "aws_subnet" "public_a" {
  vpc_id     = aws_vpc.core.id
  cidr_block = "10.10.1.0/24"
}

resource "aws_security_group" "web_sg" {
  name   = "web-sg"
  vpc_id = aws_vpc.core.id
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

module "redis" {
  source  = "terraform-aws-modules/elasticache/aws"
  version = "~> 1.0"
}
`
    const project = parseTerraformToProject([{ name: 'main.tf', content: hcl }], 'Imported App')

    expect(project.provider).toBe('aws')
    expect(project.nodes.map((n) => n.type)).toEqual(
      expect.arrayContaining(['tf_backend', 'aws_vpc', 'aws_subnet', 'aws_security_group', 'tf_module_call']),
    )

    const sg = project.nodes.find((n) => n.type === 'aws_security_group')
    expect(sg?.properties.ingress).toContain('tcp 443 0.0.0.0/0')

    // Inferred containment edges back to VPC
    expect(project.edges.filter((e) => e.kind === 'contains').length).toBeGreaterThanOrEqual(2)

    // Round-trip back to Terraform HCL
    const gen = generateTerraform(project)
    expect(Object.keys(gen.files).length).toBeGreaterThan(0)
  })
})

