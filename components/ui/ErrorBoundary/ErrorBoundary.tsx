'use client'

import {ErrorDisplay} from '@/components/ui/ErrorDisplay/ErrorDisplay'
import {logger} from '@/lib/utils/logger'
import {Component, type ReactNode} from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<
  Readonly<ErrorBoundaryProps>,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {hasError: false}

  static getDerivedStateFromError(): ErrorBoundaryState {
    return {hasError: true}
  }

  componentDidCatch(error: Error & {digest?: string}): void {
    logger.error('ErrorBoundary caught error', error, {
      context: 'ErrorBoundary',
      digest: error.digest
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <ErrorDisplay />
    }

    return this.props.children
  }
}
