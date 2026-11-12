import { useState } from 'react'
import { MotionConfig } from 'framer-motion'
import Toolbar from './components/Toolbar'
import Sidebar from './components/Sidebar'
import Canvas from './components/Canvas'
import PropertiesPanel from './components/PropertiesPanel'
import ExamplesModal from './components/ExamplesModal'
import CodePreviewModal from './components/CodePreviewModal'

function isDesktopViewport() {
  return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
}

export default function App() {
  const [examplesOpen, setExamplesOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(isDesktopViewport)
  const [propertiesOpen, setPropertiesOpen] = useState(isDesktopViewport)

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-full flex-col overflow-hidden">
        <Toolbar
          sidebarOpen={sidebarOpen}
          propertiesOpen={propertiesOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onToggleProperties={() => setPropertiesOpen((v) => !v)}
          onOpenExamples={() => setExamplesOpen(true)}
          onOpenPreview={() => setPreviewOpen(true)}
        />
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="relative min-w-0 flex-1">
            <Canvas
              onOpenExamples={() => setExamplesOpen(true)}
              onOpenSidebar={() => setSidebarOpen(true)}
              onOpenProperties={() => setPropertiesOpen(true)}
            />
          </main>
          <PropertiesPanel open={propertiesOpen} onClose={() => setPropertiesOpen(false)} />
        </div>
        <ExamplesModal open={examplesOpen} onOpenChange={setExamplesOpen} />
        <CodePreviewModal open={previewOpen} onOpenChange={setPreviewOpen} />
      </div>
    </MotionConfig>
  )
}
