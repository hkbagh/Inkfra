import Toolbar from './components/Toolbar'
import Sidebar from './components/Sidebar'
import Canvas from './components/Canvas'
import PropertiesPanel from './components/PropertiesPanel'

export default function App() {
  return (
    <div className="h-full flex flex-col">
      <Toolbar />
      <div className="flex-1 flex min-h-0">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <Canvas />
        </main>
        <PropertiesPanel />
      </div>
    </div>
  )
}
