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
  error: (Error & {digest?: string}) | null
}

/**
 * Get user-friendly error message based on error properties.
 * In production, Next.js hides error messages from Server Components,
 * so we need to infer the error type from context.
 */
function getUserFriendlyMessage(
  error: Error & {digest?: string},
  customMessage?: string
): string {
  // If custom message provided, use it
  if (customMessage) {
    return customMessage
  }

  // Check for common error patterns in the message
  const errorMsg = error.message.toLowerCase()

  if (errorMsg.includes('rate limit')) {
    return 'Too many requests. Please wait a moment and try again. Logging in may help increase your rate limit.'
  }

  if (errorMsg.includes('not found') || errorMsg.includes('404')) {
    return 'The requested content could not be found.'
  }

  if (errorMsg.includes('forbidden') || errorMsg.includes('403')) {
    return 'Access to this content is restricted.'
  }

  if (errorMsg.includes('authentication') || errorMsg.includes('expired')) {
    return 'Your session has expired. Please log in again.'
  }

  // In production, Next.js shows generic error message for Server Components
  // Check if this is a production error (has digest but generic message)
  if (
    error.digest &&
    errorMsg.includes('server components') &&
    errorMsg.includes('production')
  ) {
    return 'Unable to load this content. This may be due to rate limiting or temporary unavailability. Please try again in a moment or log in to continue.'
  }

  // Return original message or fallback
  return error.message || 'Please try again in a moment.'
}

export class ErrorBoundary extends Component<
  Readonly<ErrorBoundaryProps>,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {hasError: false, error: null}

  static getDerivedStateFromError(
    error: Error & {digest?: string}
  ): ErrorBoundaryState {
    return {hasError: true, error}
  }

  componentDidCatch(error: Error & {digest?: string}): void {
    logger.error('ErrorBoundary caught error', error, {
      context: 'ErrorBoundary',
      digest: error.digest
    })
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      const {fallback, title, message} = this.props

      // If custom fallback provided, use it
      if (fallback) {
        return fallback
      }

      // Get user-friendly error message
      const errorMessage = getUserFriendlyMessage(this.state.error, message)
      const errorTitle = title || 'Something went wrong'

      return (
        <ErrorDisplay
          title={errorTitle}
          message={errorMessage}
          digest={this.state.error.digest}
        />
      )
    }

    return this.props.children
  }
}
