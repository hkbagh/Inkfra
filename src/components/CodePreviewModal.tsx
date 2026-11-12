import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { saveAs } from 'file-saver'
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Download,
  FileCode2,
  FolderTree,
  X,
} from 'lucide-react'
import { generateTerraform } from '../lib/terraform'
import { validateProject } from '../lib/validate'
import { useStore } from '../store/useStore'

interface CodePreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function slugifyFile(s: string) {
  return (
    (s || 'project')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'project'
  )
}

export default function CodePreviewModal({ open, onOpenChange }: CodePreviewModalProps) {
  const nodes = useStore((s) => s.nodes)
  const edges = useStore((s) => s.edges)
  const projectName = useStore((s) => s.projectName)
  const exportLayout = useStore((s) => s.exportLayout)
  const setExportLayout = useStore((s) => s.setExportLayout)
  const toProject = useStore((s) => s.toProject)
  const focusNode = useStore((s) => s.focusNode)

  const [selectedFile, setSelectedFile] = useState('versions.tf')
  const [copiedTab, setCopiedTab] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  const project = open ? toProject() : null
  const gen = project ? generateTerraform(project) : { files: {} as Record<string, string>, warnings: [] as string[] }
  const issues = project ? validateProject(project) : []

  const files = gen.files
  const fileNames = Object.keys(files)
  const currentFile = fileNames.includes(selectedFile) ? selectedFile : fileNames[0] || 'main.tf'
  const currentContent = files[currentFile] || ''
  const copied = copiedTab === currentFile

  const errorIssues = issues.filter((i) => i.level === 'error')
  const warningIssues = issues.filter((i) => i.level === 'warning')
  const allWarnings = [
    ...warningIssues,
    ...gen.warnings.map((message) => ({ level: 'warning' as const, message })),
  ]

  const handleCopy = async () => {
    if (!currentContent) return
    try {
      await navigator.clipboard.writeText(currentContent)
      const tabAtCopy = currentFile
      setCopiedTab(tabAtCopy)
      window.setTimeout(() => {
        setCopiedTab((prev) => (prev === tabAtCopy ? null : prev))
      }, 1600)
    } catch {
      setCopiedTab(null)
    }
  }

  const handleDownloadZip = async () => {
    if (downloading || errorIssues.length > 0 || fileNames.length === 0) return
    setDownloading(true)
    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      for (const [name, content] of Object.entries(files)) zip.file(name, content)
      const blob = await zip.generateAsync({ type: 'blob' })
      saveAs(blob, `${slugifyFile(projectName)}.zip`)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) setCopiedTab(null)
        onOpenChange(next)
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm" />
        <Dialog.Content className="dialog-content fixed left-1/2 top-1/2 z-50 flex h-[min(90vh,800px)] w-[min(96vw,1080px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-500/10 text-[var(--accent)]">
                <Code2 size={18} />
              </div>
              <div>
                <Dialog.Title className="text-base font-semibold tracking-tight sm:text-lg">
                  Production IaC & DevOps Output
                </Dialog.Title>
                <Dialog.Description className="mt-0.5 text-xs text-[var(--text-muted)]">
                  <span className="font-medium text-[var(--text)]">{projectName || 'inkfra'}</span> · {nodes.length}{' '}
                  resources · {edges.length} connectors · {fileNames.length} files
                </Dialog.Description>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-0.5"
                role="group"
                aria-label="Export layout"
              >
                <button
                  type="button"
                  onClick={() => {
                    setExportLayout('modular')
                    setCopiedTab(null)
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    exportLayout === 'modular'
                      ? 'bg-blue-500/20 text-blue-200 ring-1 ring-inset ring-blue-400/35'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <FolderTree size={12} />
                  Modular Repo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExportLayout('single')
                    setCopiedTab(null)
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    exportLayout === 'single'
                      ? 'bg-blue-500/20 text-blue-200 ring-1 ring-inset ring-blue-400/35'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <FileCode2 size={12} />
                  Single main.tf
                </button>
              </div>

              <Dialog.Close asChild>
                <button type="button" className="btn btn-ghost btn-icon h-8 w-8 shrink-0" aria-label="Close code preview">
                  <X size={16} />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Validation status strip */}
          {(errorIssues.length > 0 || allWarnings.length > 0) && (
            <div className="max-h-24 overflow-y-auto border-b border-[var(--border)] bg-[var(--surface-2)] px-5 py-2 sm:px-6">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {errorIssues.length > 0 ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-red-300">
                    <AlertCircle size={13} />
                    {errorIssues.length} validation {errorIssues.length === 1 ? 'error' : 'errors'} (fix before ZIP
                    export)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-medium text-amber-300">
                    <AlertTriangle size={13} />
                    {allWarnings.length} {allWarnings.length === 1 ? 'warning' : 'warnings'}
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {[...errorIssues, ...allWarnings].slice(0, 6).map((issue, idx) => (
                  <button
                    key={`${issue.level}-${idx}`}
                    type="button"
                    onClick={() => {
                      if ('nodeId' in issue && issue.nodeId) {
                        focusNode(issue.nodeId)
                        onOpenChange(false)
                      }
                    }}
                    className={`rounded-md border px-2 py-1 text-left text-[11px] leading-snug transition-colors ${
                      issue.level === 'error'
                        ? 'border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20'
                        : 'border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20'
                    }`}
                  >
                    {issue.message}
                  </button>
                ))}
              </div>
            </div>
          )}

          {errorIssues.length === 0 && allWarnings.length === 0 && nodes.length > 0 && (
            <div className="flex items-center gap-2 border-b border-[var(--border)] bg-emerald-500/[0.06] px-5 py-2 text-xs text-emerald-300 sm:px-6">
              <CheckCircle2 size={14} />
              All validation checks passed — ready to export.
            </div>
          )}

          {/* Split pane: file tree + code viewer */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
            {/* Desktop file sidebar */}
            <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-[var(--border)] bg-[var(--surface-2)]/70 p-2 md:block">
              <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Bundle Files ({fileNames.length})
              </div>
              <div className="space-y-0.5">
                {fileNames.map((fileName) => {
                  const active = fileName === currentFile
                  return (
                    <button
                      key={fileName}
                      type="button"
                      onClick={() => {
                        setSelectedFile(fileName)
                        setCopiedTab(null)
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left font-mono text-[11px] transition-colors ${
                        active
                          ? 'bg-blue-500/15 text-blue-200 ring-1 ring-inset ring-blue-400/35'
                          : 'text-[var(--text-muted)] hover:bg-white/[0.05] hover:text-[var(--text)]'
                      }`}
                    >
                      <FileCode2 size={13} className="shrink-0" />
                      <span className="truncate">{fileName}</span>
                    </button>
                  )
                })}
              </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <select
                    value={currentFile}
                    onChange={(e) => {
                      setSelectedFile(e.target.value)
                      setCopiedTab(null)
                    }}
                    className="select font-mono text-xs md:hidden"
                    aria-label="Select file"
                  >
                    {fileNames.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                  <span className="hidden truncate font-mono text-xs font-medium text-[var(--text)] md:inline">
                    {currentFile}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!currentContent}
                  className="btn btn-secondary shrink-0 px-2.5 py-1 text-xs"
                >
                  {copied ? <Check size={13} className="text-emerald-300" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied' : 'Copy file'}</span>
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-auto bg-[#0b101b] p-4 sm:p-5">
                <pre className="whitespace-pre font-mono text-[12px] leading-relaxed text-slate-200">
                  <code>{currentContent}</code>
                </pre>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--surface-2)] px-5 py-3.5 sm:px-6">
            <span className="text-[11px] text-[var(--text-muted)]">
              Run <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-slate-200">make validate</code>{' '}
              or <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-slate-200">terraform fmt</code>{' '}
              after extracting.
            </span>
            <div className="flex items-center gap-2">
              <Dialog.Close asChild>
                <button type="button" className="btn btn-secondary">
                  Close
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={downloading || errorIssues.length > 0 || fileNames.length === 0}
                className="btn btn-primary"
                title={
                  errorIssues.length > 0 ? 'Resolve validation errors before downloading' : 'Download DevOps bundle ZIP'
                }
              >
                <Download size={14} />
                <span>{downloading ? 'Preparing ZIP…' : 'Download .zip'}</span>
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
