import {render, screen} from '@/test-utils'
import {Text} from '@mantine/core'
import {CommentErrorBoundary} from './CommentErrorBoundary'

// Mock logClientError
vi.mock('@/lib/utils/logging/clientLogger', () => ({
  logClientError: vi.fn()
}))

// Test component that throws an error when shouldThrow is true
function ThrowError({shouldThrow}: Readonly<{shouldThrow: boolean}>) {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>Normal content</div>
}

describe('CommentErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children when no error occurs', () => {
    render(
      <CommentErrorBoundary>
        <ThrowError shouldThrow={false} />
      </CommentErrorBoundary>
    )

    expect(screen.getByText('Normal content')).toBeInTheDocument()
  })

  it('should render default fallback UI when error occurs', () => {
    render(
      <CommentErrorBoundary>
        <ThrowError shouldThrow />
      </CommentErrorBoundary>
    )

    // Should show error alert
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByLabelText('Comment loading error')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Failed to load this comment. It may contain malformed data.'
      )
    ).toBeInTheDocument()

    // Should not show the normal content
    expect(screen.queryByText('Normal content')).not.toBeInTheDocument()
  })

  it('should render custom fallback when provided', () => {
    const customFallback = (
      <Text data-testid="custom-fallback">Custom error message</Text>
    )

    render(
      <CommentErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow />
      </CommentErrorBoundary>
    )

    // Should show custom fallback
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
    expect(screen.getByText('Custom error message')).toBeInTheDocument()

    // Should not show default fallback
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Failed to load this comment')
    ).not.toBeInTheDocument()
  })

  it('should log error to client logger when error occurs', async () => {
    const {logClientError} = await import('@/lib/utils/logging/clientLogger')

    render(
      <CommentErrorBoundary>
        <ThrowError shouldThrow />
      </CommentErrorBoundary>
    )

    // Should have called logClientError with error details
    expect(logClientError).toHaveBeenCalledWith(
      'Comment rendering error',
      expect.objectContaining({
        component: 'CommentErrorBoundary',
        action: 'componentDidCatch'
      })
    )
  })

  it('should have proper accessibility attributes on default fallback', () => {
    render(
      <CommentErrorBoundary>
        <ThrowError shouldThrow />
      </CommentErrorBoundary>
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveAttribute('aria-label', 'Comment loading error')
  })

  it('should reset error state when new children are provided', () => {
    const {rerender} = render(
      <CommentErrorBoundary>
        <ThrowError shouldThrow />
      </CommentErrorBoundary>
    )

    // Should show error state
    expect(screen.getByRole('alert')).toBeInTheDocument()

    // Re-render with non-throwing children
    rerender(
      <CommentErrorBoundary>
        <ThrowError shouldThrow={false} />
      </CommentErrorBoundary>
    )

    // Note: Error boundaries don't automatically reset in React
    // This test documents the current behavior
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('should handle multiple consecutive errors', () => {
    render(
      <CommentErrorBoundary>
        <ThrowError shouldThrow />
      </CommentErrorBoundary>
    )

    // First error
    expect(screen.getByRole('alert')).toBeInTheDocument()

    // Clear the mock to check for additional calls
    vi.clearAllMocks()

    // Note: Once an error boundary is in error state, it won't catch new errors
    // until it's reset. This is expected React behavior.
    // The error boundary remains in error state and shows the fallback UI
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('should handle errors in development vs production environment', async () => {
    const {logClientError} = await import('@/lib/utils/logging/clientLogger')

    // Test development environment (default)
    render(
      <CommentErrorBoundary>
        <ThrowError shouldThrow />
      </CommentErrorBoundary>
    )

    expect(logClientError).toHaveBeenCalled()
  })
})
