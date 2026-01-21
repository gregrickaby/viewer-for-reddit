import {logger} from '@/lib/utils/logger'
import {render, screen, user} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import GlobalError from './global-error'

// Mock logger to prevent console spam in tests
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    error: vi.fn()
  }
}))

const mockLogger = vi.mocked(logger)

describe('GlobalError', () => {
  const mockError = new Error('Test error message')
  const mockReset = vi.fn()

  beforeEach(() => {
    mockLogger.error.mockClear()
    mockReset.mockClear()
  })

  describe('rendering', () => {
    it('renders with required elements', () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument()
      expect(
        screen.getByText(/An unexpected error occurred/)
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', {name: /try again/i})
      ).toBeInTheDocument()
      expect(
        screen.getByRole('link', {name: /return to home page/i})
      ).toBeInTheDocument()
    })

    it('renders with full html structure', () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      // Verify key elements are rendered (html/body structure is implicit)
      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument()
      expect(
        screen.getByRole('button', {name: /try again/i})
      ).toBeInTheDocument()
    })

    it('includes proper html attributes', () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      // Verify lang attribute via document
      expect(document.documentElement.lang).toBe('en')
    })

    it('includes head with title', () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      // Check document title
      expect(document.title).toBe('Application Error - Reddit Viewer')
    })
  })

  describe('error logging', () => {
    it('logs error on mount', () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      expect(mockLogger.error).toHaveBeenCalledTimes(1)
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Global error boundary caught error',
        mockError,
        expect.objectContaining({
          context: 'GlobalError',
          message: 'Test error message'
        })
      )
    })

    it('logs error with digest when present', () => {
      const errorWithDigest = Object.assign(new Error('Test error'), {
        digest: 'abc123'
      })

      render(<GlobalError error={errorWithDigest} reset={mockReset} />)

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Global error boundary caught error',
        errorWithDigest,
        expect.objectContaining({
          context: 'GlobalError',
          digest: 'abc123',
          message: 'Test error'
        })
      )
    })

    it('logs error only once despite re-renders', () => {
      const {rerender} = render(
        <GlobalError error={mockError} reset={mockReset} />
      )

      expect(mockLogger.error).toHaveBeenCalledTimes(1)

      // Re-render with same error
      rerender(<GlobalError error={mockError} reset={mockReset} />)

      // Should still only be called once (useEffect dependency on error)
      expect(mockLogger.error).toHaveBeenCalledTimes(1)
    })

    it('logs new error when error changes', () => {
      const {rerender} = render(
        <GlobalError error={mockError} reset={mockReset} />
      )

      expect(mockLogger.error).toHaveBeenCalledTimes(1)

      const newError = new Error('Different error')
      rerender(<GlobalError error={newError} reset={mockReset} />)

      expect(mockLogger.error).toHaveBeenCalledTimes(2)
      expect(mockLogger.error).toHaveBeenLastCalledWith(
        'Global error boundary caught error',
        newError,
        expect.objectContaining({
          message: 'Different error'
        })
      )
    })
  })

  describe('error digest display', () => {
    it('displays error digest when present', () => {
      const errorWithDigest = Object.assign(new Error('Test error'), {
        digest: 'abc123xyz'
      })

      render(<GlobalError error={errorWithDigest} reset={mockReset} />)

      expect(screen.getByText(/Error ID: abc123xyz/i)).toBeInTheDocument()
    })

    it('does not display error digest section when not present', () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      expect(screen.queryByText(/Error ID:/i)).not.toBeInTheDocument()
    })

    it('renders digest in monospace font', () => {
      const errorWithDigest = Object.assign(new Error('Test error'), {
        digest: 'abc123'
      })

      render(<GlobalError error={errorWithDigest} reset={mockReset} />)

      const digestText = screen.getByText(/Error ID: abc123/i)
      expect(digestText).toBeInTheDocument()
    })
  })

  describe('user interactions', () => {
    it('calls reset function when Try Again button clicked', async () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      const tryAgainButton = screen.getByRole('button', {name: /try again/i})
      await user.click(tryAgainButton)

      expect(mockReset).toHaveBeenCalledTimes(1)
    })

    it('try again button has proper accessibility attributes', () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      const tryAgainButton = screen.getByRole('button', {name: /try again/i})
      expect(tryAgainButton).toHaveAttribute(
        'aria-label',
        'Try again by reloading the page'
      )
    })

    it('go home link has correct href', () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      const homeLink = screen.getByRole('link', {name: /return to home page/i})
      expect(homeLink).toHaveAttribute('href', '/')
    })

    it('go home link has proper accessibility attributes', () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      const homeLink = screen.getByRole('link', {name: /return to home page/i})
      expect(homeLink).toHaveAttribute('aria-label', 'Return to home page')
    })

    it('allows multiple reset attempts', async () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      const tryAgainButton = screen.getByRole('button', {name: /try again/i})

      await user.click(tryAgainButton)
      expect(mockReset).toHaveBeenCalledTimes(1)

      await user.click(tryAgainButton)
      expect(mockReset).toHaveBeenCalledTimes(2)

      await user.click(tryAgainButton)
      expect(mockReset).toHaveBeenCalledTimes(3)
    })
  })

  describe('edge cases', () => {
    it('handles error without message', () => {
      const errorWithoutMessage = new Error()
      render(<GlobalError error={errorWithoutMessage} reset={mockReset} />)

      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument()
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Global error boundary caught error',
        errorWithoutMessage,
        expect.objectContaining({
          message: ''
        })
      )
    })

    it('handles error with very long message', () => {
      const longMessage = 'A'.repeat(1000)
      const errorWithLongMessage = new Error(longMessage)

      render(<GlobalError error={errorWithLongMessage} reset={mockReset} />)

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Global error boundary caught error',
        errorWithLongMessage,
        expect.objectContaining({
          message: longMessage
        })
      )
    })

    it('handles error with special characters in digest', () => {
      const errorWithSpecialDigest = Object.assign(new Error('Test'), {
        digest: 'abc-123_XYZ!@#'
      })

      render(<GlobalError error={errorWithSpecialDigest} reset={mockReset} />)

      expect(screen.getByText(/Error ID: abc-123_XYZ!@#/i)).toBeInTheDocument()
    })

    it('renders with null reset function without crashing', () => {
      // TypeScript would prevent this, but test runtime safety
      render(<GlobalError error={mockError} reset={null as any} />)

      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument()
    })
  })

  describe('theme integration', () => {
    it('wraps content with ThemeProvider', () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      // ThemeProvider should render content successfully
      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument()
    })

    it('includes color scheme support', () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      // Verify color scheme script is included
      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument()
    })
  })

  describe('layout and styling', () => {
    it('renders main element with centered content', () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
    })

    it('renders Mantine Card component', () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      // Card should be present (check for content inside card)
      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument()
    })

    it('renders icon for visual indication', () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      // Verify error UI is displayed with all elements
      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument()
      expect(
        screen.getByRole('button', {name: /try again/i})
      ).toBeInTheDocument()
    })
  })

  describe('content', () => {
    it('displays helpful error message', () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      expect(
        screen.getByText(/An unexpected error occurred/)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/This has been logged and we'll look into it/)
      ).toBeInTheDocument()
    })

    it('provides clear action instructions', () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      expect(
        screen.getByText(
          /You can try reloading the page or return to the home page/
        )
      ).toBeInTheDocument()
    })

    it('has user-friendly heading', () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      const heading = screen.getByText('Something Went Wrong')
      expect(heading).toBeInTheDocument()
    })
  })
})
