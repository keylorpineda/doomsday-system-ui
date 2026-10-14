import { Component } from "react"

import type { ErrorInfo, ReactNode } from "react"

interface ErrorBoundaryProps {
  onClose: () => void
  children: ReactNode
}
interface ErrorBoundaryState {
  error: Error | null
}

/** Aísla fallos de WebGL/Three.js para que no tumben toda la app. */
export class SceneErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[CampScene3D] error al renderizar la escena:", error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="camp3d-error">
          <div className="camp3d-error-title">⚠ Fallo en la vista 3D</div>
          <div className="camp3d-error-detail">{this.state.error.message}</div>
          <button type="button" className="camp3d-error-btn" onClick={this.props.onClose}>
            ◄ Ir al Panel
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
