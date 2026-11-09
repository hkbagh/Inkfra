import { describe, it, expect } from 'vitest'
import { slugify, hclValue, hclBlock } from './hcl'

describe('hcl', () => {
  it('slugifies labels', () => {
    expect(slugify('My VPC!')).toBe('my_vpc')
    expect(slugify('123abc')).toBe('r_123abc')
  })
  it('serializes values', () => {
    expect(hclValue(true)).toBe('true')
    expect(hclValue(42)).toBe('42')
    expect(hclValue('hi')).toBe('"hi"')
    expect(hclValue('${aws_vpc.x.id}')).toBe('aws_vpc.x.id')
  })
  it('builds blocks', () => {
    const out = hclBlock('aws_vpc', 'main', { cidr_block: '10.0.0.0/16' })
    expect(out).toContain('resource "aws_vpc" "main"')
    expect(out).toContain('cidr_block = "10.0.0.0/16"')
  })
})
