import {beforeEach, describe, expect, it, vi} from 'vitest'

// Mock server actions to avoid env var errors
vi.mock('@/lib/actions/auth', () => ({
  clearExpiredSession: vi.fn(async () => {})
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

import {render, screen, user} from '@/test-utils'
import {useRouter} from 'next/navigation'
import {ErrorDisplay} from './ErrorDisplay'

const mockUseRouter = vi.mocked(useRouter)

describe('ErrorDisplay', () => {
  const mockPush = vi.fn()
  const mockRefresh = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
      replace: vi.fn()
    } as any)
  })

  describe('rendering', () => {
    it('renders with default props', () => {
      render(<ErrorDisplay />)

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(
        screen.getByText('An unexpected error occurred. Please try again.')
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', {name: 'Try Again'})
      ).toBeInTheDocument()
      expect(screen.getByRole('button', {name: 'Go Home'})).toBeInTheDocument()
    })

    it('renders custom title', () => {
      render(<ErrorDisplay title="Custom Error Title" />)

      expect(screen.getByText('Custom Error Title')).toBeInTheDocument()
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })

    it('renders custom message', () => {
      render(<ErrorDisplay message="Custom error message here" />)

      expect(screen.getByText('Custom error message here')).toBeInTheDocument()
      expect(
        screen.queryByText('An unexpected error occurred. Please try again.')
      ).not.toBeInTheDocument()
    })

    it('renders both custom title and message', () => {
      render(
        <ErrorDisplay
          title="Network Error"
          message="Unable to connect to the server"
        />
      )

      expect(screen.getByText('Network Error')).toBeInTheDocument()
      expect(
        screen.getByText('Unable to connect to the server')
      ).toBeInTheDocument()
    })

    it('renders error icon', () => {
      const {container} = render(<ErrorDisplay />)

      // eslint-disable-next-line testing-library/no-container
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('button visibility', () => {
    it('shows retry button by default', () => {
      render(<ErrorDisplay />)

      expect(
        screen.getByRole('button', {name: 'Try Again'})
      ).toBeInTheDocument()
    })

    it('hides retry button when showRetry is false', () => {
      render(<ErrorDisplay showRetry={false} />)

      expect(
        screen.queryByRole('button', {name: 'Try Again'})
      ).not.toBeInTheDocument()
    })

    it('shows home button by default', () => {
      render(<ErrorDisplay />)

      expect(screen.getByRole('button', {name: 'Go Home'})).toBeInTheDocument()
    })

    it('hides home button when showHome is false', () => {
      render(<ErrorDisplay showHome={false} />)

      expect(
        screen.queryByRole('button', {name: 'Go Home'})
      ).not.toBeInTheDocument()
    })

    it('hides both buttons when both props are false', () => {
      render(<ErrorDisplay showRetry={false} showHome={false} />)

      expect(
        screen.queryByRole('button', {name: 'Try Again'})
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', {name: 'Go Home'})
      ).not.toBeInTheDocument()
    })
  })

  describe('user interactions', () => {
    it('calls router.refresh when Try Again is clicked', async () => {
      render(<ErrorDisplay />)

      const tryAgainButton = screen.getByRole('button', {name: 'Try Again'})
      await user.click(tryAgainButton)

      expect(mockRefresh).toHaveBeenCalledTimes(1)
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('calls router.push with / when Go Home is clicked', async () => {
      render(<ErrorDisplay />)

      const goHomeButton = screen.getByRole('button', {name: 'Go Home'})
      await user.click(goHomeButton)

      expect(mockPush).toHaveBeenCalledWith('/')
      expect(mockPush).toHaveBeenCalledTimes(1)
      expect(mockRefresh).not.toHaveBeenCalled()
    })

    it('handles multiple clicks on Try Again', async () => {
      render(<ErrorDisplay />)

      const tryAgainButton = screen.getByRole('button', {name: 'Try Again'})
      await user.click(tryAgainButton)
      await user.click(tryAgainButton)

      expect(mockRefresh).toHaveBeenCalledTimes(2)
    })

    it('handles multiple clicks on Go Home', async () => {
      render(<ErrorDisplay />)

      const goHomeButton = screen.getByRole('button', {name: 'Go Home'})
      await user.click(goHomeButton)
      await user.click(goHomeButton)

      expect(mockPush).toHaveBeenCalledTimes(2)
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  describe('edge cases', () => {
    it('renders with empty title', () => {
      render(<ErrorDisplay title="" />)

      const titleElement = screen.queryByText('Something went wrong')
      expect(titleElement).not.toBeInTheDocument()
    })

    it('renders with empty message', () => {
      render(<ErrorDisplay message="" />)

      const messageElement = screen.queryByText(
        'An unexpected error occurred. Please try again.'
      )
      expect(messageElement).not.toBeInTheDocument()
    })

    it('renders with very long title', () => {
      const longTitle = 'A'.repeat(200)
      render(<ErrorDisplay title={longTitle} />)

      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('renders with very long message', () => {
      const longMessage = 'B'.repeat(500)
      render(<ErrorDisplay message={longMessage} />)

      expect(screen.getByText(longMessage)).toBeInTheDocument()
    })
  })
})
