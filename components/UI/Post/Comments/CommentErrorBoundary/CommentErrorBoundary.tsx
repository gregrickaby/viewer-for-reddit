'use client'

import {Alert, Text} from '@mantine/core'
import {Component, type ErrorInfo, type ReactNode} from 'react'
import {BiError} from 'react-icons/bi'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Error boundary component for comment rendering.
 *
 * Catches JavaScript errors anywhere in the comment tree and displays
 * a fallback UI instead of crashing the entire component tree.
 *
 * @security Prevents malformed comment data from crashing the app
 */
export class CommentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {hasError: false}
  }

  static getDerivedStateFromError(error: Error): State {
    return {hasError: true, error}
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for monitoring
    console.error('Comment rendering error:', error, errorInfo)

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        this.props.fallback || (
          <Alert
            icon={<BiError />}
            color="red"
            variant="light"
            role="alert"
            aria-label="Comment loading error"
          >
            <Text size="sm">
              Failed to load this comment. It may contain malformed data.
            </Text>
          </Alert>
        )
      )
    }

    return this.props.children
  }
}
