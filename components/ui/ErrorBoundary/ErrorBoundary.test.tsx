import {logger} from '@/lib/utils/logger'
import {render, screen} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {ErrorBoundary} from './ErrorBoundary'

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))

const mockLoggerError = vi.mocked(logger.error)

function ThrowError({error}: {error?: Error}): React.ReactNode {
  throw error || new Error('Test error')
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error in tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rendering', () => {
    it('renders children when no error', () => {
      render(
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Child content')).toBeInTheDocument()
    })

    it('renders error UI when error is caught', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('Test error')).toBeInTheDocument()
      expect(
        screen.getByRole('button', {name: 'Reload Page'})
      ).toBeInTheDocument()
    })

    it('renders custom error message from error object', () => {
      const customError = new Error('Custom error message')

      render(
        <ErrorBoundary>
          <ThrowError error={customError} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom error message')).toBeInTheDocument()
    })

    it('renders default message when error has no message', () => {
      const emptyError = new Error('')

      render(
        <ErrorBoundary>
          <ThrowError error={emptyError} />
        </ErrorBoundary>
      )

      expect(
        screen.getByText('An unexpected error occurred. Please try again.')
      ).toBeInTheDocument()
    })
  })

  describe('custom fallback', () => {
    it('renders custom fallback when provided', () => {
      const customFallback = <div>Custom error UI</div>

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom error UI')).toBeInTheDocument()
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })

    it('renders custom fallback with complex UI', () => {
      const customFallback = (
        <div>
          <h1>Error Title</h1>
          <p>Error Details</p>
          <button type="button">Custom Button</button>
        </div>
      )

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Error Title')).toBeInTheDocument()
      expect(screen.getByText('Error Details')).toBeInTheDocument()
      expect(
        screen.getByRole('button', {name: 'Custom Button'})
      ).toBeInTheDocument()
    })
  })

  describe('error logging', () => {
    it('logs error with logger when error is caught', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(mockLoggerError).toHaveBeenCalledWith(
        'ErrorBoundary caught an error',
        expect.objectContaining({
          error: expect.any(Error),
          errorInfo: expect.any(Object)
        }),
        expect.objectContaining({
          context: 'ErrorBoundary',
          forceProduction: true
        })
      )
    })

    it('logs error with correct error message', () => {
      const customError = new Error('Specific error message')

      render(
        <ErrorBoundary>
          <ThrowError error={customError} />
        </ErrorBoundary>
      )

      expect(mockLoggerError).toHaveBeenCalledWith(
        'ErrorBoundary caught an error',
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Specific error message'
          })
        }),
        expect.any(Object)
      )
    })
  })

  describe('reload functionality', () => {
    it('reloads page when Reload Page button is clicked', () => {
      const mockReload = vi.fn()
      Object.defineProperty(globalThis, 'location', {
        value: {reload: mockReload},
        writable: true
      })

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const reloadButton = screen.getByRole('button', {name: 'Reload Page'})
      reloadButton.click()

      expect(mockReload).toHaveBeenCalledTimes(1)
    })
  })

  describe('edge cases', () => {
    it('handles error without message property', () => {
      const errorWithoutMessage = {name: 'CustomError'} as Error

      render(
        <ErrorBoundary>
          <ThrowError error={errorWithoutMessage} />
        </ErrorBoundary>
      )

      expect(
        screen.getByText('An unexpected error occurred. Please try again.')
      ).toBeInTheDocument()
    })

    it('handles multiple children', () => {
      render(
        <ErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
          <div>Third child</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('First child')).toBeInTheDocument()
      expect(screen.getByText('Second child')).toBeInTheDocument()
      expect(screen.getByText('Third child')).toBeInTheDocument()
    })

    it('handles nested ErrorBoundaries', () => {
      render(
        <ErrorBoundary>
          <ErrorBoundary>
            <div>Nested content</div>
          </ErrorBoundary>
        </ErrorBoundary>
      )

      expect(screen.getByText('Nested content')).toBeInTheDocument()
    })

    it('catches error in nested ErrorBoundary', () => {
      render(
        <ErrorBoundary fallback={<div>Outer fallback</div>}>
          <ErrorBoundary fallback={<div>Inner fallback</div>}>
            <ThrowError />
          </ErrorBoundary>
        </ErrorBoundary>
      )

      expect(screen.getByText('Inner fallback')).toBeInTheDocument()
      expect(screen.queryByText('Outer fallback')).not.toBeInTheDocument()
    })
  })
})
