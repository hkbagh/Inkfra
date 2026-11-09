import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error } }
  componentDidCatch(error: Error) { console.error('Inkfra error:', error) }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="h-full flex items-center justify-center text-slate-300">
          <div className="max-w-md text-center">
            <div className="text-lg font-semibold mb-2">Something went wrong</div>
            <div className="text-sm text-slate-500 mb-4">{this.state.error?.message}</div>
            <button onClick={() => this.setState({ hasError: false, error: undefined })} className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-sm">Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
