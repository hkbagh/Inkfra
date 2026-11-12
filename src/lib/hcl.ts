export function slugify(s: string): string {
  let out =
    s
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_') || 'res'
  if (/^[0-9]/.test(out)) out = 'r_' + out
  return out
}

export function hclValue(v: unknown, indent = 0): string {
  if (v === null || v === undefined) return 'null'
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '0'
  if (Array.isArray(v)) {
    return `[${v.map((item) => hclValue(item, indent)).join(', ')}]`
  }
  if (typeof v === 'object') {
    const entries = Object.entries(v as Record<string, unknown>)
    if (entries.length === 0) return '{}'
    const pad = '  '.repeat(indent + 1)
    const closePad = '  '.repeat(indent)
    const maxLen = Math.max(...entries.map(([k]) => k.length))
    const lines = entries.map(([k, val]) => `${pad}${k.padEnd(maxLen)} = ${hclValue(val, indent + 1)}`)
    return `{\n${lines.join('\n')}\n${closePad}}`
  }
  const s = String(v)
  // Allow raw HCL expressions if wrapped in ${...}
  if (s.startsWith('${') && s.endsWith('}')) return s.slice(2, -1)
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
}

export function alignAttributes(entries: Array<[string, string]>, indent = '  '): string[] {
  if (entries.length === 0) return []
  const maxKeyLen = Math.max(...entries.map(([k]) => k.length))
  return entries.map(([k, val]) => `${indent}${k.padEnd(maxKeyLen)} = ${val}`)
}

export function hclBlock(type: string, name: string, props: Record<string, unknown>, extra: string[] = []): string {
  const entries: Array<[string, string]> = []
  for (const [k, v] of Object.entries(props)) {
    if (v === '' || v === null || v === undefined) continue
    entries.push([k, hclValue(v, 1)])
  }

  // Align plain key = value attributes together (including simple one-line extra attributes like tags/depends_on)
  const extraAttrs: Array<[string, string]> = []
  const extraBlocks: string[] = []
  for (const line of extra) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx > 0 && !trimmed.includes('\n')) {
      const k = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim()
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k)) {
        extraAttrs.push([k, val])
        continue
      }
    }
    extraBlocks.push(line)
  }

  const allAttrs = [...entries, ...extraAttrs]
  const attrLines = alignAttributes(allAttrs, '  ')
  const blockLines = extraBlocks.map((b) =>
    b
      .split('\n')
      .map((l) => (l ? `  ${l}` : l))
      .join('\n'),
  )

  const combined = [...attrLines, ...blockLines]
  const body = combined.length ? combined.join('\n') + '\n' : ''
  return `resource "${type}" "${name}" {\n${body}}\n`
}
