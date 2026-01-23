'use client'

import {logger} from '@/lib/utils/logger'
import {Component, type ReactNode} from 'react'

interface ErrorBoundaryProps {
  fallback: ReactNode
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

  componentDidCatch(error: Error): void {
    logger.error('ErrorBoundary caught error', error, {
      context: 'ErrorBoundary'
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}
