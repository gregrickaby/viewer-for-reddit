import {logger} from '@/lib/utils/logger'
import {render, screen} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import GlobalError from './global-error'

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn()
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

  it('renders generic error content and actions', () => {
    render(<GlobalError error={mockError} reset={mockReset} />)

    // Verify title
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    // Verify list structure
    const list = document.querySelector('ol')
    expect(list).toBeInTheDocument()
    expect(list?.querySelectorAll('li')).toHaveLength(3)

    // Verify login button
    expect(
      screen.getByRole('link', {name: /log in with reddit/i})
    ).toBeInTheDocument()
  })

  it('links login button to auth', () => {
    render(<GlobalError error={mockError} reset={mockReset} />)

    const loginButton = screen.getByRole('link', {
      name: /log in with reddit/i
    })
    expect(loginButton.closest('a')).toHaveAttribute('href', '/api/auth/login')
  })

  it('sets document title and html lang', () => {
    render(<GlobalError error={mockError} reset={mockReset} />)

    expect(document.title).toBe('Error - Viewer for Reddit')
    expect(document.documentElement.lang).toBe('en')
  })

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

  it('handles error without message', () => {
    const errorWithoutMessage = new Error()
    render(<GlobalError error={errorWithoutMessage} reset={mockReset} />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Global error boundary caught error',
      errorWithoutMessage,
      expect.objectContaining({
        message: ''
      })
    )
  })
})
