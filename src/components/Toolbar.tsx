import { useRef, useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Select from '@radix-ui/react-select'
import * as Tooltip from '@radix-ui/react-tooltip'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Code2,
  Download,
  FileJson,
  Info,
  Loader2,
  MoreHorizontal,
  PanelLeft,
  PanelRight,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { generateTerraform } from '../lib/terraform'
import { validateProject } from '../lib/validate'
import { parseProject } from '../lib/project'
import { saveAs } from 'file-saver'
import { InkfraLogo, ProviderLogo } from './BrandLogos'

interface ToolbarProps {
  sidebarOpen: boolean
  propertiesOpen: boolean
  onToggleSidebar: () => void
  onToggleProperties: () => void
  onOpenExamples: () => void
  onOpenPreview: () => void
}

const TARGET_PROVIDERS = [
  { value: 'aws', label: 'AWS' },
  { value: 'azure', label: 'Azure' },
  { value: 'gcp', label: 'GCP' },
  { value: 'multi', label: 'Multi-cloud' },
] as const

export default function Toolbar({
  sidebarOpen,
  propertiesOpen,
  onToggleSidebar,
  onToggleProperties,
  onOpenExamples,
  onOpenPreview,
}: ToolbarProps) {
  const projectName = useStore((s) => s.projectName)
  const projectDescription = useStore((s) => s.projectDescription)
  const targetProvider = useStore((s) => s.targetProvider)
  const setProjectName = useStore((s) => s.setProjectName)
  const setProjectDescription = useStore((s) => s.setProjectDescription)
  const setTargetProvider = useStore((s) => s.setTargetProvider)
  const clear = useStore((s) => s.clear)
  const loadProject = useStore((s) => s.loadProject)
  const importTerraform = useStore((s) => s.importTerraform)
  const toProject = useStore((s) => s.toProject)
  const focusNode = useStore((s) => s.focusNode)
  const nodes = useStore((s) => s.nodes)
  const hasSelection = useStore((s) => Boolean(s.selectedNodeId || s.selectedEdgeId))

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [issues, setIssues] = useState<ReturnType<typeof validateProject>>([])
  const [showIssues, setShowIssues] = useState(false)
  const [status, setStatus] = useState<{ kind: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [genState, setGenState] = useState<'idle' | 'busy' | 'done'>('idle')

  const errorCount = issues.filter((i) => i.level === 'error').length
  const warningCount = issues.filter((i) => i.level === 'warning').length

  const handleValidate = () => {
    const p = toProject()
    const res = validateProject(p)
    setIssues(res)
    setShowIssues(true)
    const errs = res.filter((i) => i.level === 'error').length
    const warns = res.filter((i) => i.level === 'warning').length
    setStatus({
      kind: errs > 0 ? 'error' : warns > 0 ? 'info' : 'success',
      text: `Validation: ${errs} errors, ${warns} warnings`,
    })
  }

  const handleGenerate = async () => {
    if (genState === 'busy') return
    const p = toProject()
    const allIssues = validateProject(p)
    const errs = allIssues.filter((i) => i.level === 'error')
    if (errs.length) {
      setIssues(allIssues)
      setShowIssues(true)
      setStatus({ kind: 'error', text: 'Fix validation errors before generating.' })
      return
    }
    setGenState('busy')
    try {
      const { files, warnings } = generateTerraform(p)
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      for (const [name, content] of Object.entries(files)) zip.file(name, content)
      const blob = await zip.generateAsync({ type: 'blob' })
      saveAs(blob, `${slugifySafe(projectName)}.zip`)
      setStatus({
        kind: 'success',
        text: `Generated ${Object.keys(files).length} files${warnings.length ? ` (${warnings.length} warnings)` : ''}.`,
      })
      if (warnings.length) {
        setIssues(warnings.map((w) => ({ level: 'warning' as const, message: w })))
        setShowIssues(true)
      }
      setGenState('done')
      window.setTimeout(() => setGenState('idle'), 1600)
    } catch {
      setGenState('idle')
      setStatus({ kind: 'error', text: 'Failed to generate Terraform archive.' })
    }
  }

  const handleExportJson = () => {
    const p = toProject()
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' })
    saveAs(blob, `${slugifySafe(projectName)}.inkfra.json`)
    setStatus({ kind: 'success', text: 'Exported project JSON.' })
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!fileList.length) return

    const tfFiles = fileList.filter((f) => f.name.toLowerCase().endsWith('.tf'))
    if (tfFiles.length > 0) {
      try {
        const contents = await Promise.all(tfFiles.map(async (f) => ({ name: f.name, content: await f.text() })))
        const baseName = tfFiles[0].name.replace(/\.tf$/i, '') || 'Imported Stack'
        const parsed = importTerraform(contents, baseName === 'main' ? 'Imported Terraform' : baseName)
        setIssues([])
        setShowIssues(false)
        setStatus({
          kind: parsed.nodes.length ? 'success' : 'info',
          text: parsed.nodes.length
            ? `Imported ${parsed.nodes.length} resources from ${tfFiles.length} .tf file(s).`
            : 'No mapped resources found in Terraform file(s).',
        })
      } catch {
        setStatus({ kind: 'error', text: 'Failed to read Terraform file(s).' })
      }
      return
    }

    const file = fileList[0]
    try {
      const text = await file.text()
      const parsed = parseProject(JSON.parse(text))
      if (!parsed) {
        setStatus({ kind: 'error', text: 'Invalid project file.' })
        return
      }
      loadProject(parsed)
      setIssues([])
      setShowIssues(false)
      setStatus({ kind: 'success', text: `Imported "${parsed.name}".` })
    } catch {
      setStatus({ kind: 'error', text: 'Invalid JSON file.' })
    }
  }

  const handleClear = () => {
    if (nodes.length && !confirm('Clear canvas?')) return
    clear()
    setIssues([])
    setShowIssues(false)
    setStatus({ kind: 'info', text: 'Canvas cleared.' })
  }

  return (
    <Tooltip.Provider delayDuration={350}>
      <header className="toolbar relative z-30">
        <div className="flex items-center justify-between gap-2 px-2.5 py-2 sm:px-4">
          {/* Brand + Library toggle */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  onClick={onToggleSidebar}
                  className={`btn btn-icon ${sidebarOpen ? 'btn-secondary' : 'btn-ghost'}`}
                  aria-label="Toggle resource library"
                >
                  <PanelLeft size={15} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  sideOffset={6}
                  className="z-50 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] text-[var(--text)] shadow-lg"
                >
                  Toggle Resource Library
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>

            <div className="flex items-center gap-2 pl-0.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/12 bg-gradient-to-br from-blue-500/20 via-indigo-500/15 to-violet-500/20 shadow-md shadow-blue-500/15">
                <InkfraLogo size={19} />
              </div>
              <div className="hidden sm:block">
                <div className="text-[13px] font-semibold leading-tight tracking-tight">Inkfra</div>
                <div className="text-[10px] leading-tight text-[var(--text-muted)]">Visual-to-IaC</div>
              </div>
            </div>
          </div>

          <div className="mx-0.5 hidden h-6 w-px bg-[var(--border)] sm:block" />

          {/* Project inputs + Provider logo select */}
          <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="input min-w-0 flex-1 sm:w-40 sm:flex-none md:w-44"
              placeholder="Project name"
              aria-label="Project name"
            />
            <input
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="input hidden w-44 xl:block 2xl:w-60"
              placeholder="Description"
              aria-label="Project description"
            />

            <Select.Root
              value={targetProvider}
              onValueChange={(val) => setTargetProvider(val as typeof targetProvider)}
            >
              <Select.Trigger
                aria-label="Target provider"
                className="select inline-flex shrink-0 items-center justify-between gap-1.5 px-2 sm:w-32"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <ProviderLogo provider={targetProvider} size={14} />
                  <span className="hidden text-xs font-medium sm:inline">
                    {TARGET_PROVIDERS.find((p) => p.value === targetProvider)?.label}
                  </span>
                </span>
                <Select.Icon>
                  <ChevronDown size={13} className="text-[var(--text-muted)]" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content
                  position="popper"
                  sideOffset={5}
                  className="z-50 min-w-[155px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-1 shadow-[var(--shadow)]"
                >
                  <Select.Viewport>
                    {TARGET_PROVIDERS.map((p) => (
                      <Select.Item
                        key={p.value}
                        value={p.value}
                        className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--text)] outline-none transition-colors data-[highlighted]:bg-white/[0.06]"
                      >
                        <span className="flex items-center gap-2">
                          <ProviderLogo provider={p.value} size={14} />
                          <Select.ItemText>{p.label}</Select.ItemText>
                        </span>
                        <Select.ItemIndicator>
                          <Check size={12} className="text-[var(--accent)]" />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>

          {/* Primary & secondary actions */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <button type="button" onClick={onOpenExamples} className="btn btn-secondary px-2.5 sm:px-3" title="Examples">
              <Sparkles size={14} className="text-[var(--accent)]" />
              <span className="hidden md:inline">Examples</span>
            </button>

            <button type="button" onClick={handleValidate} className="btn btn-secondary px-2.5 sm:px-3" title="Validate diagram">
              <CheckCircle2 size={14} className={errorCount > 0 ? 'text-red-400' : 'text-emerald-400'} />
              <span className="hidden md:inline">Validate</span>
              {(errorCount > 0 || warningCount > 0) && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                    errorCount > 0 ? 'bg-red-400/20 text-red-300' : 'bg-amber-400/20 text-amber-300'
                  }`}
                >
                  {errorCount > 0 ? errorCount : warningCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenPreview}
              className="btn btn-secondary px-2.5 sm:px-3"
              title="Preview generated Terraform files"
            >
              <Code2 size={14} className="text-blue-300" />
              <span className="hidden md:inline">Preview .tf</span>
            </button>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={genState === 'busy'}
              className="btn btn-primary px-2.5 sm:px-3.5"
              title="Generate Terraform ZIP"
            >
              {genState === 'busy' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : genState === 'done' ? (
                <Check size={14} />
              ) : (
                <Download size={14} />
              )}
              <span className="hidden sm:inline">{genState === 'done' ? 'Exported' : 'Generate .tf'}</span>
            </button>

            {/* Desktop inline file actions */}
            <div className="hidden items-center gap-1 lg:flex">
              <div className="mx-0.5 h-6 w-px bg-[var(--border)]" />
              <button type="button" onClick={handleExportJson} className="btn btn-ghost" title="Export project JSON">
                <FileJson size={14} />
                <span className="hidden xl:inline">Export</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-ghost"
                title="Import Inkfra JSON or Terraform (.tf) files"
              >
                <Upload size={14} />
                <span className="hidden xl:inline">Import</span>
              </button>
              <button type="button" onClick={handleClear} className="btn btn-ghost" title="Clear canvas">
                <Trash2 size={14} />
                <span className="hidden xl:inline">Clear</span>
              </button>
            </div>

            {/* Mobile / tablet overflow menu */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon lg:hidden"
                  aria-label="More project actions"
                >
                  <MoreHorizontal size={15} />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={6}
                  className="z-50 min-w-[180px] rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-1.5 shadow-[var(--shadow)]"
                >
                  <DropdownMenu.Item
                    onSelect={onOpenPreview}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--text)] outline-none data-[highlighted]:bg-white/[0.06]"
                  >
                    <Code2 size={14} className="text-blue-300" />
                    Preview .tf
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onSelect={handleExportJson}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--text)] outline-none data-[highlighted]:bg-white/[0.06]"
                  >
                    <FileJson size={14} className="text-[var(--text-muted)]" />
                    Export JSON
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onSelect={() => fileInputRef.current?.click()}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--text)] outline-none data-[highlighted]:bg-white/[0.06]"
                  >
                    <Upload size={14} className="text-[var(--text-muted)]" />
                    Import JSON / .tf
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="my-1 h-px bg-[var(--border)]" />
                  <DropdownMenu.Item
                    onSelect={handleClear}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-red-300 outline-none data-[highlighted]:bg-red-500/15"
                  >
                    <Trash2 size={14} />
                    Clear Canvas
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            {/* Properties panel toggle */}
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  onClick={onToggleProperties}
                  className={`btn btn-icon relative ${propertiesOpen ? 'btn-secondary' : 'btn-ghost'}`}
                  aria-label="Toggle properties panel"
                >
                  <PanelRight size={15} />
                  {hasSelection && !propertiesOpen && (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--accent)] ring-2 ring-[var(--surface)]" />
                  )}
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  sideOffset={6}
                  className="z-50 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] text-[var(--text)] shadow-lg"
                >
                  Toggle Properties Panel
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json,.tf"
              multiple
              onChange={handleImportFile}
              className="hidden"
            />
          </div>
        </div>

        {/* Animated validation results drawer */}
        <AnimatePresence>
          {showIssues && issues.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden px-3 pb-3 sm:px-4"
            >
              <div className="max-h-48 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/95 p-3 shadow-[var(--shadow-sm)]">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text)]">
                    <CheckCircle2 size={13} className="text-[var(--accent)]" />
                    Validation results
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowIssues(false)}
                    className="btn btn-ghost h-6 px-2 text-[11px]"
                  >
                    Close
                  </button>
                </div>
                <ul className="space-y-1">
                  {issues.map((i, idx) => (
                    <li key={idx}>
                      <button
                        type="button"
                        disabled={!i.nodeId}
                        onClick={() => i.nodeId && focusNode(i.nodeId)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-xs transition-colors ${
                          i.nodeId ? 'cursor-pointer hover:bg-white/[0.05]' : 'cursor-default'
                        }`}
                      >
                        <span
                          className={`inline-flex w-20 shrink-0 items-center justify-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                            i.level === 'error'
                              ? 'bg-red-400/15 text-red-300'
                              : i.level === 'warning'
                                ? 'bg-amber-300/15 text-amber-300'
                                : 'bg-slate-300/10 text-slate-300'
                          }`}
                        >
                          {i.level === 'error' ? (
                            <AlertCircle size={10} />
                          ) : i.level === 'warning' ? (
                            <AlertTriangle size={10} />
                          ) : (
                            <Info size={10} />
                          )}
                          {i.level}
                        </span>
                        <span className="flex-1 text-[var(--text-muted)]">{i.message}</span>
                        {i.nodeId && (
                          <span className="text-[10px] font-medium text-[var(--accent)]">Locate →</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animated status banner */}
        <AnimatePresence>
          {status && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.16 }}
              className="overflow-hidden px-3 pb-2 sm:px-4"
            >
              <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/80 px-2.5 py-1 text-[11px] text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5 truncate">
                  {status.kind === 'error' ? (
                    <AlertCircle size={12} className="shrink-0 text-red-400" />
                  ) : status.kind === 'success' ? (
                    <CheckCircle2 size={12} className="shrink-0 text-emerald-400" />
                  ) : (
                    <Info size={12} className="shrink-0 text-blue-400" />
                  )}
                  <span className="truncate">{status.text}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setStatus(null)}
                  className="rounded p-0.5 text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text)]"
                  aria-label="Dismiss status"
                >
                  <X size={11} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </Tooltip.Provider>
  )
}

function slugifySafe(s: string) {
  return (
    (s || 'project')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'project'
  )
}
