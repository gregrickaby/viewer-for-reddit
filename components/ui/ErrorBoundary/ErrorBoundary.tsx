'use client'

import {AuthExpiredError} from '@/components/ui/AuthExpiredError'
import {
  isAuthError,
  isNotFoundError,
  isRateLimitError
} from '@/lib/utils/errors'
import {logger} from '@/lib/utils/logger'
import {Button, Card, Container, Stack, Text, Title} from '@mantine/core'
import {Component, ReactNode} from 'react'

/**
 * Props for the ErrorBoundary component.
 */
interface Props {
  /** Child components to render */
  children: ReactNode
  /** Optional custom fallback UI */
  fallback?: ReactNode
}

/**
 * State for the ErrorBoundary component.
 */
interface State {
  /** Whether an error has been caught */
  hasError: boolean
  /** The caught error object */
  error?: Error
}

/**
 * React Error Boundary for catching and handling component errors.
 * Prevents entire app crash when a child component throws an error.
 *
 * Features:
 * - Logs errors to console (forced even in production)
 * - Custom fallback UI with reload button
 * - Can accept custom fallback component via props
 *
 * @example
 * ```typescript
 * <ErrorBoundary fallback={<CustomError />}>
 *   <AsyncComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {hasError: false}
  }

  static getDerivedStateFromError(error: Error): State {
    return {hasError: true, error}
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error(
      'ErrorBoundary caught an error',
      {error, errorInfo},
      {
        context: 'ErrorBoundary',
        forceProduction: true
      }
    )
  }

  render() {
    if (this.state.hasError) {
      // Check if error is authentication-related FIRST (before fallback)
      // This ensures auth errors always show AuthExpiredError component
      if (isAuthError(this.state.error)) {
        return (
          <Container size="sm" py="xl">
            <AuthExpiredError />
          </Container>
        )
      }

      if (this.props.fallback) {
        return this.props.fallback
      }

      const errorMessage = this.state.error?.message || ''
      const isRateLimit = isRateLimitError(this.state.error)
      const isNotFound = isNotFoundError(this.state.error)

      let title = 'Something went wrong'
      if (isRateLimit) {
        title = 'Rate Limit Reached'
      } else if (isNotFound) {
        title = 'Not Found'
      }

      return (
        <Container size="sm" py="xl">
          <Card withBorder padding="xl" radius="md">
            <Stack gap="md" align="center">
              <Title order={2} c="red">
                {title}
              </Title>
              <Text size="sm" c="dimmed" ta="center">
                {errorMessage ||
                  'An unexpected error occurred. Please try again.'}
              </Text>
              {isRateLimit ? (
                <Button component="a" href="/api/auth/login">
                  Sign In
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    this.setState({hasError: false, error: undefined})
                    globalThis.location.reload()
                  }}
                >
                  Reload Page
                </Button>
              )}
            </Stack>
          </Card>
        </Container>
      )
    }

    return this.props.children
  }
}
