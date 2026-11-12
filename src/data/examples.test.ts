import { describe, expect, it } from 'vitest'
import { EXAMPLES } from './examples'
import { validateProject } from '../lib/validate'
import { generateTerraform } from '../lib/terraform'

describe('example projects', () => {
  it('has unique ids', () => {
    expect(new Set(EXAMPLES.map((example) => example.id)).size).toBe(EXAMPLES.length)
  })

  it.each(EXAMPLES)('$name has no validation errors', ({ project }) => {
    const issues = validateProject(project)
    expect(issues.filter((issue) => issue.level === 'error')).toEqual([])
  })

  it.each(EXAMPLES)('$name generates Terraform & DevOps bundle', ({ project }) => {
    const result = generateTerraform(project)
    const keys = Object.keys(result.files)
    expect(keys).toEqual(expect.arrayContaining(['variables.tf', 'outputs.tf', 'README.md']))
    if (project.exportLayout === 'single') {
      expect(keys).toContain('main.tf')
      expect(result.files['main.tf']).toContain('terraform {')
    } else {
      expect(keys).toEqual(expect.arrayContaining(['versions.tf', 'providers.tf', 'Makefile', '.gitignore']))
      expect(result.files['versions.tf']).toContain('terraform {')
    }
  })
})
