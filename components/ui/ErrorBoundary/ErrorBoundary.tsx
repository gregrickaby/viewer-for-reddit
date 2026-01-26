'use client'

import {ErrorDisplay} from '@/components/ui/ErrorDisplay/ErrorDisplay'
import {logger} from '@/lib/utils/logger'
import {Component, type ReactNode} from 'react'

interface ErrorBoundaryProps {
  fallback?: ReactNode
  title?: string
  message?: string
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<
  Readonly<ErrorBoundaryProps>,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {hasError: false, error: null}

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {hasError: true, error}
  }

  componentDidCatch(error: Error): void {
    logger.error('ErrorBoundary caught error', error, {
      context: 'ErrorBoundary'
    })
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      const {fallback, title, message} = this.props

      // If custom fallback provided, use it
      if (fallback) {
        return fallback
      }

      // Otherwise use ErrorDisplay with error message
      const errorMessage =
        message || this.state.error.message || 'Please try again in a moment.'
      const errorTitle = title || 'Something went wrong'

      return <ErrorDisplay title={errorTitle} message={errorMessage} />
    }

    return this.props.children
  }
}
