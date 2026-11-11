import { useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { generateTerraform } from '../lib/terraform'
import { validateProject } from '../lib/validate'
import { parseProject } from '../lib/project'
import { saveAs } from 'file-saver'
import { iconMap as Lucide } from '../lib/iconMap'
import { useTheme } from '../store/useTheme'

export default function Toolbar() {
  const projectName = useStore((s) => s.projectName)
  const projectDescription = useStore((s) => s.projectDescription)
  const targetProvider = useStore((s) => s.targetProvider)
  const setProjectName = useStore((s) => s.setProjectName)
  const setProjectDescription = useStore((s) => s.setProjectDescription)
  const setTargetProvider = useStore((s) => s.setTargetProvider)
  const clear = useStore((s) => s.clear)
  const loadProject = useStore((s) => s.loadProject)
  const toProject = useStore((s) => s.toProject)
  const nodes = useStore((s) => s.nodes)
  const theme = useTheme((s) => s.theme)
  const toggleTheme = useTheme((s) => s.toggle)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [issues, setIssues] = useState<ReturnType<typeof validateProject>>([])
  const [showIssues, setShowIssues] = useState(false)
  const [lastMsg, setLastMsg] = useState('')

  const handleValidate = () => {
    const p = toProject()
    const res = validateProject(p)
    setIssues(res)
    setShowIssues(true)
    setLastMsg(`Validation: ${res.filter((i) => i.level === 'error').length} errors, ${res.filter((i) => i.level === 'warning').length} warnings`)
  }

  const handleGenerate = async () => {
    const p = toProject()
    const errs = validateProject(p).filter((i) => i.level === 'error')
    if (errs.length) {
      setIssues(validateProject(p))
      setShowIssues(true)
      setLastMsg('Fix validation errors before generating.')
      return
    }
    const { files, warnings } = generateTerraform(p)
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    for (const [name, content] of Object.entries(files)) zip.file(name, content)
    const blob = await zip.generateAsync({ type: 'blob' })
    saveAs(blob, `${slugifySafe(projectName)}.zip`)
    setLastMsg(`Generated ${Object.keys(files).length} files${warnings.length ? ` (${warnings.length} warnings)` : ''}.`)
    if (warnings.length) {
      setIssues(warnings.map((w) => ({ level: 'warning' as const, message: w })))
      setShowIssues(true)
    }
  }

  const handleExportJson = () => {
    const p = toProject()
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' })
    saveAs(blob, `${slugifySafe(projectName)}.inkfra.json`)
    setLastMsg('Exported project JSON.')
  }

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = parseProject(JSON.parse(String(reader.result)))
        if (!parsed) { setLastMsg('Invalid project file.'); return }
        loadProject(parsed)
        setLastMsg('Imported project.')
      } catch {
        setLastMsg('Invalid JSON file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleClear = () => {
    if (nodes.length && !confirm('Clear canvas?')) return
    clear()
    setLastMsg('Canvas cleared.')
  }

  return (
    <div className="border-b themed-border themed-surface">
      <div className="flex items-center gap-3 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Lucide.Workflow size={16} />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">Inkfra</div>
            <div className="text-[10px] text-slate-500 leading-tight">Visual-to-IaC Canvas</div>
          </div>
        </div>

        <input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="px-3 py-1.5 rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-sm w-48"
          placeholder="Project name"
        />
        <input
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          className="px-3 py-1.5 rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-sm w-64"
          placeholder="Description"
        />
        <select value={targetProvider} onChange={(e) => setTargetProvider(e.target.value as any)} className="px-2 py-1.5 rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-sm">
          <option value="aws">AWS</option>
          <option value="azure">Azure</option>
          <option value="gcp">GCP</option>
          <option value="multi">Multi-cloud</option>
        </select>

        <div className="flex-1" />

        <button onClick={handleValidate} className="px-3 py-1.5 rounded-md bg-[var(--surface-2)] hover:bg-[var(--surface)] active:scale-95 text-sm flex items-center gap-1.5 transition">
          <Lucide.CheckCircle2 size={14} /> Validate
        </button>
        <button onClick={handleGenerate} className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 active:scale-95 text-sm transition flex items-center gap-1.5">
          <Lucide.Download size={14} /> Generate .tf
        </button>
        <button onClick={handleExportJson} className="px-3 py-1.5 rounded-md bg-[var(--surface-2)] hover:bg-[var(--surface)] active:scale-95 text-sm transition flex items-center gap-1.5">
          <Lucide.FileJson size={14} /> Export
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 rounded-md bg-[var(--surface-2)] hover:bg-[var(--surface)] active:scale-95 text-sm transition flex items-center gap-1.5">
          <Lucide.Upload size={14} /> Import
        </button>
        <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleImportJson} className="hidden" />
        <button onClick={toggleTheme} className="px-3 py-1.5 rounded-md bg-[var(--surface-2)] hover:bg-[var(--surface)] active:scale-95 text-sm transition flex items-center gap-1.5">
          {theme === 'professional' ? 'Slack' : 'Professional'}
        </button>
        <button onClick={handleClear} className="px-3 py-1.5 rounded-md bg-[var(--surface-2)] hover:bg-[var(--surface)] active:scale-95 text-sm transition flex items-center gap-1.5">
          <Lucide.Trash2 size={14} /> Clear
        </button>
      </div>

      {showIssues && issues.length > 0 && (
        <div className="px-4 pb-3">
          <div className="rounded-md bg-[var(--surface-2)] border border-[var(--border)] p-3 max-h-40 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">Validation Results</span>
              <button onClick={() => setShowIssues(false)} className="text-slate-500 hover:text-slate-300 text-xs">close</button>
            </div>
            <ul className="space-y-1">
              {issues.map((i, idx) => (
                <li key={idx} className={`text-xs flex gap-2 ${
                  i.level === 'error' ? 'text-red-400' : i.level === 'warning' ? 'text-amber-400' : 'text-slate-400'
                }`}>
                  <span className="uppercase font-bold w-16 shrink-0">{i.level}</span>
                  <span>{i.message}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {lastMsg && (
        <div className="px-4 pb-2 text-[11px] text-slate-500">{lastMsg}</div>
      )}
    </div>
  )
}

function slugifySafe(s: string) {
  return (s || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project'
}
