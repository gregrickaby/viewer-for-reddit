import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Props for ErrorBoundary component
 * @property {ReactNode} children - Components to be wrapped by error boundary
 * @property {ReactNode} [fallback] - Optional custom error UI to show when error occurs
 */
interface ErrorBoundryProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * State for ErrorBoundary component
 * @property {boolean} hasError - Whether an error has been caught
 */
interface ErrorState {
  hasError: boolean
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in their child component tree,
 * logs those errors, and displays a fallback UI.
 *
 * Features:
 * - Prevents entire app from crashing on component errors
 * - Supports custom fallback UI
 * - Logs errors to console for debugging
 * - Isolates errors to specific component trees
 */
export class ErrorBoundary extends Component<ErrorBoundryProps, ErrorState> {
  // Initialize error state.
  public state: ErrorState = {
    hasError: false
  }

  /**
   * Static method called when an error occurs during rendering.
   * Used to update state and trigger fallback UI.
   */
  public static getDerivedStateFromError(): ErrorState {
    return { hasError: true }
  }

  /**
   * Lifecycle method called after an error has been thrown.
   * Used for error logging and analytics.
   *
   * @param {Error} error - The error that was thrown
   * @param {ErrorInfo} errorInfo - Additional information about the error
   */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    // Show fallback UI if error occurred.
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex h-full w-full items-center justify-center">
            <p>Something went wrong</p>
          </div>
        )
      )
    }

    // Render children normally if no error.
    return this.props.children
  }
}
