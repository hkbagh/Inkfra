export function slugify(s: string): string {
  let out = s
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_') || 'res'
  if (/^[0-9]/.test(out)) out = 'r_' + out
  return out
}

export function hclValue(v: any): string {
  if (v === null || v === undefined) return 'null'
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'number') return String(v)
  if (Array.isArray(v)) {
    return `[${v.map(hclValue).join(', ')}]`
  }
  if (typeof v === 'object') {
    const entries = Object.entries(v).map(([k, val]) => `  ${k} = ${hclValue(val)}`)
    return `{\n${entries.join('\n')}\n}`
  }
  // string
  const s = String(v)
  // allow raw HCL expressions if wrapped in ${}
  if (s.startsWith('${') && s.endsWith('}')) return s.slice(2, -1)
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
}

export function hclBlock(type: string, name: string, props: Record<string, any>, extra: string[] = []): string {
  const lines: string[] = []
  for (const [k, v] of Object.entries(props)) {
    if (v === '' || v === null || v === undefined) continue
    lines.push(`  ${k} = ${hclValue(v)}`)
  }
  for (const e of extra) lines.push(`  ${e}`)
  const body = lines.length ? lines.join('\n') + '\n' : ''
  return `resource "${type}" "${name}" {\n${body}}\n`
}
