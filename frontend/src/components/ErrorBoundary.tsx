import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-gray-950 text-red-400 flex items-center justify-center p-8">
          <div className="border border-red-700 rounded p-6 bg-red-950 max-w-lg">
            <div className="font-bold mb-2">Rendering Error</div>
            <div className="text-xs font-mono text-red-300">{this.state.error.message}</div>
            <button
              className="mt-4 px-3 py-1 text-sm bg-gray-800 rounded hover:bg-gray-700"
              onClick={() => this.setState({ error: null })}
            >
              Retry
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
