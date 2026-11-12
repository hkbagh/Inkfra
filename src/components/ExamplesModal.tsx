import { createElement, useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion } from 'framer-motion'
import { ArrowRight, FileCode2, FolderTree, Sparkles, X } from 'lucide-react'
import { EXAMPLES, type ExampleStackFilter } from '../data/examples'
import { getIcon } from '../lib/iconMap'
import { useStore } from '../store/useStore'
import { ProviderLogo } from './BrandLogos'

interface ExamplesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FilterKey = 'all' | ExampleStackFilter

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All Blueprints' },
  { key: 'aws', label: 'AWS' },
  { key: 'azure', label: 'Azure' },
  { key: 'gcp', label: 'GCP' },
  { key: 'devops', label: 'K8s & DevOps' },
]

export default function ExamplesModal({ open, onOpenChange }: ExamplesModalProps) {
  const loadProject = useStore((s) => s.loadProject)
  const [filter, setFilter] = useState<FilterKey>('all')

  const filteredExamples = useMemo(
    () => (filter === 'all' ? EXAMPLES : EXAMPLES.filter((ex) => ex.stack === filter)),
    [filter],
  )

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) setFilter('all')
        onOpenChange(next)
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm" />
        <Dialog.Content className="dialog-content fixed left-1/2 top-1/2 z-50 flex max-h-[88vh] w-[min(95vw,940px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4 sm:px-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-500/10 text-[var(--accent)]">
                <Sparkles size={17} />
              </div>
              <div>
                <Dialog.Title className="text-base font-semibold tracking-tight sm:text-lg">
                  Production Infrastructure Blueprints
                </Dialog.Title>
                <Dialog.Description className="mt-0.5 max-w-2xl text-xs leading-relaxed text-[var(--text-muted)]">
                  Load a validated multi-tier architecture to inspect canvas wiring, DevSecOps checks, and modular IaC +
                  DevOps output.
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button type="button" className="btn btn-ghost btn-icon h-8 w-8 shrink-0" aria-label="Close examples">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-[var(--border)] bg-[var(--surface-2)]/70 px-5 py-2.5 sm:px-6">
            {FILTERS.map((item) => {
              const count =
                item.key === 'all' ? EXAMPLES.length : EXAMPLES.filter((ex) => ex.stack === item.key).length
              const active = filter === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    active
                      ? 'bg-blue-500/20 text-blue-200 ring-1 ring-inset ring-blue-400/40'
                      : 'text-[var(--text-muted)] hover:bg-white/[0.04] hover:text-[var(--text)]'
                  }`}
                >
                  {item.key !== 'all' && (
                    <ProviderLogo provider={item.key === 'devops' ? 'kubernetes' : item.key} size={12} />
                  )}
                  <span>{item.label}</span>
                  <span className="rounded bg-black/25 px-1.5 py-0.25 text-[10px] text-[var(--text-muted)]">
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-4 sm:p-5 md:grid-cols-2">
            {filteredExamples.map((example, idx) => {
              const Icon = getIcon(example.icon)
              const layoutLabel = example.project.exportLayout === 'single' ? 'Single main.tf' : 'Modular Repo'
              return (
                <motion.button
                  key={example.id}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.03, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => {
                    loadProject(example.project)
                    onOpenChange(false)
                  }}
                  className="group relative flex h-full w-full flex-col justify-between overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400/50 hover:bg-[var(--surface-3)] hover:shadow-[var(--shadow-sm)] active:translate-y-0"
                >
                  <div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-[var(--accent)] transition-transform duration-200 group-hover:scale-105">
                        {createElement(Icon, { size: 19 })}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-semibold text-[var(--text)]">{example.name}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="chip">
                            <ProviderLogo provider={example.project.provider} size={11} />
                            {example.project.provider.toUpperCase()}
                          </span>
                          {example.badge && <span className="chip chip-accent">{example.badge}</span>}
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                            {example.project.exportLayout === 'single' ? (
                              <FileCode2 size={10} />
                            ) : (
                              <FolderTree size={10} />
                            )}
                            {layoutLabel}
                          </span>
                        </div>
                      </div>
                      <ArrowRight
                        size={15}
                        className="mt-1 shrink-0 text-[var(--text-muted)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--accent)]"
                      />
                    </div>

                    <p className="mt-2.5 text-xs leading-relaxed text-[var(--text-muted)]">{example.description}</p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {example.highlights.map((highlight) => (
                        <span
                          key={highlight}
                          className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] ring-1 ring-inset ring-white/10"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3.5 flex items-center gap-2 border-t border-white/[0.06] pt-2.5 text-[11px] text-[var(--text-muted)]">
                    <span>{example.project.nodes.length} resources</span>
                    <span className="text-[var(--border-strong)]">·</span>
                    <span>{example.project.edges.length} connectors</span>
                    <span className="ml-auto font-medium text-[var(--accent)] opacity-85 transition-opacity group-hover:opacity-100">
                      Load blueprint →
                    </span>
                  </div>
                </motion.button>
              )
            })}
          </div>

          <div className="flex shrink-0 items-center justify-between gap-4 border-t border-[var(--border)] bg-[var(--surface-2)] px-5 py-3.5 sm:px-6">
            <span className="text-[11px] text-[var(--text-muted)]">
              Showing {filteredExamples.length} of {EXAMPLES.length} blueprints · Every resource is editable on canvas.
            </span>
            <Dialog.Close asChild>
              <button type="button" className="btn btn-secondary">
                Close
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
