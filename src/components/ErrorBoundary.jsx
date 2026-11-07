import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[DentalUI] Render error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="m-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-[12px] text-red-700"
        >
          <p className="font-semibold">界面加载异常</p>
          <pre className="mt-2 whitespace-pre-wrap break-all text-[11px]">
            {this.state.error?.message || String(this.state.error)}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-red-700"
          >
            重新加载
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
