import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
    children: ReactNode
    moduleName?: string
}

interface State {
    hasError: boolean
    error: Error | null
}

/**
 * A lighter error boundary for wrapping individual modules/sections.
 * Shows inline error UI instead of taking over the whole page.
 */
export class ModuleErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`[${this.props.moduleName || 'Module'}] Error:`, error, errorInfo)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-bg-secondary border border-border gap-4 min-h-[200px]">
                    <div className="text-red-500">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <p className="text-text-secondary text-sm font-medium text-center">
                        {this.props.moduleName ? `${this.props.moduleName} failed to load` : 'This section failed to load'}
                    </p>
                    {this.state.error && (
                        <p className="text-xs text-text-muted max-w-sm text-center truncate">
                            {this.state.error.message}
                        </p>
                    )}
                    <button
                        onClick={this.handleReset}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-bold text-xs hover:bg-emerald-600 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

export default ModuleErrorBoundary
