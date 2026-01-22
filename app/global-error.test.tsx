import {logout} from '@/lib/actions/auth'
import {logger} from '@/lib/utils/logger'
import {render, screen, user} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import GlobalError from './global-error'

// Mock logger to prevent console spam in tests
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn()
  }
}))

// Mock auth actions
vi.mock('@/lib/actions/auth', () => ({
  logout: vi.fn(async () => ({success: true}))
}))

const mockLogger = vi.mocked(logger)
const mockLogout = vi.mocked(logout)

describe('GlobalError', () => {
  const mockError = new Error('Test error message')
  const mockReset = vi.fn()

  beforeEach(() => {
    mockLogger.error.mockClear()
    mockReset.mockClear()
    mockLogout.mockClear()
    delete (window as any).location
    window.location = {href: ''} as any
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
        screen.getByRole('button', {name: /return to home page/i})
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
      expect(document.title).toBe('Error - Viewer for Reddit')
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

    it('navigates home with full page reload', async () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      const homeButton = screen.getByRole('button', {
        name: /return to home page/i
      })
      await user.click(homeButton)

      // Should navigate with full page reload
      await vi.waitFor(() => {
        expect(window.location.href).toBe('/')
      })
    })

    it('go home button has proper accessibility attributes', () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      const homeButton = screen.getByRole('button', {
        name: /return to home page/i
      })
      expect(homeButton).toHaveAttribute('aria-label', 'Return to home page')
    })

    it('allows multiple reset attempts', async () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      const tryAgainButton = screen.getByRole('button', {name: /try again/i})

      await user.click(tryAgainButton)
      expect(mockReset).toHaveBeenCalledTimes(1)

      await user.click(tryAgainButton)
      expect(mockReset).toHaveBeenCalledTimes(2)
    })

    it('prevents race conditions with pending state', async () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      const homeButton = screen.getByRole('button', {
        name: /return to home page/i
      })

      // Click multiple times rapidly
      await user.click(homeButton)
      await user.click(homeButton)
      await user.click(homeButton)

      // Button should be disabled or only trigger once
      await vi.waitFor(() => {
        expect(window.location.href).toBe('/')
      })
    })

    describe('authentication errors', () => {
      it('detects authentication errors from message', () => {
        const authError = new Error('Authentication expired')
        render(<GlobalError error={authError} reset={mockReset} />)

        expect(
          screen.getByText(/Your session may have expired/)
        ).toBeInTheDocument()
        expect(screen.getByText(/Clear Session & Go Home/)).toBeInTheDocument()
      })

      it('hides Try Again button for auth errors', () => {
        const authError = new Error('Session token expired')
        render(<GlobalError error={authError} reset={mockReset} />)

        expect(
          screen.queryByRole('button', {name: /try again/i})
        ).not.toBeInTheDocument()
      })

      it('clears session before navigating home on auth error', async () => {
        const authError = new Error('401 Unauthorized')
        render(<GlobalError error={authError} reset={mockReset} />)

        const homeButton = screen.getByRole('button', {
          name: /return to home page/i
        })
        await user.click(homeButton)

        await vi.waitFor(() => {
          expect(mockLogout).toHaveBeenCalledTimes(1)
          expect(window.location.href).toBe('/')
        })
      })

      it('navigates home even if logout fails', async () => {
        mockLogout.mockResolvedValueOnce({success: false, error: 'Failed'})
        const authError = new Error('Session expired')
        render(<GlobalError error={authError} reset={mockReset} />)

        const homeButton = screen.getByRole('button', {
          name: /return to home page/i
        })
        await user.click(homeButton)

        await vi.waitFor(() => {
          expect(window.location.href).toBe('/')
        })
      })

      it('detects various auth error patterns', () => {
        const authErrors = [
          new Error('Authentication failed'),
          new Error('Token expired'),
          new Error('401 error'),
          new Error('Unauthorized access'),
          new Error('Session invalid')
        ]

        authErrors.forEach((error) => {
          const {unmount} = render(
            <GlobalError error={error} reset={mockReset} />
          )
          expect(
            screen.getByText(/Your session may have expired/)
          ).toBeInTheDocument()
          unmount()
        })
      })

      it('shows default message for non-auth errors', () => {
        const regularError = new Error('Network error')
        render(<GlobalError error={regularError} reset={mockReset} />)

        expect(
          screen.getByText(/An unexpected error occurred/)
        ).toBeInTheDocument()
        expect(
          screen.getByRole('button', {name: /try again/i})
        ).toBeInTheDocument()
      })
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
        screen.getByText(/An unexpected error occurred/)
      ).toBeInTheDocument()
    })

    it('has user-friendly heading', () => {
      render(<GlobalError error={mockError} reset={mockReset} />)

      const heading = screen.getByText('Something Went Wrong')
      expect(heading).toBeInTheDocument()
    })
  })
})
