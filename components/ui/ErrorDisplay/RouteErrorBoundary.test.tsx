import {logger} from '@/lib/datadog/client'
import {addNextjsError} from '@datadog/browser-rum-nextjs'
import {render, screen, user, waitFor} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'

vi.mock('@/lib/actions/auth/auth', () => ({
  getAuthStatus: vi.fn()
}))

import {getAuthStatus} from '@/lib/actions/auth/auth'
import {createRouteErrorBoundary} from './RouteErrorBoundary'

const mockGetAuthStatus = vi.mocked(getAuthStatus)

const testError = Object.assign(new Error('boom'), {digest: 'abc123'})

describe('createRouteErrorBoundary', () => {
  beforeEach(() => {
    mockGetAuthStatus.mockResolvedValue({isAuthenticated: true})
  })

  it('logs to Datadog with the configured message and context', () => {
    const RouteError = createRouteErrorBoundary({
      message: 'Search page error',
      context: 'SearchPageError'
    })

    render(<RouteError error={testError} retry={vi.fn()} />)

    expect(addNextjsError).toHaveBeenCalledWith(testError)
    expect(logger.error).toHaveBeenCalledWith('Search page error', {
      error: 'boom',
      context: 'SearchPageError',
      digest: 'abc123'
    })
  })

  it('renders ErrorDisplay and wires retry to the Try Again button', async () => {
    const retry = vi.fn()
    const RouteError = createRouteErrorBoundary({
      message: 'Donate page error',
      context: 'DonatePageError',
      containerSize: 'md',
      containerPy: 'xl'
    })

    render(<RouteError error={testError} retry={retry} />)

    await user.click(screen.getByRole('button', {name: /try again/i}))
    expect(retry).toHaveBeenCalledOnce()
  })

  it('renders unwrapped when no containerSize is configured', () => {
    const RouteError = createRouteErrorBoundary({
      message: 'Route error caught',
      context: 'MainLayoutError'
    })

    render(<RouteError error={testError} retry={vi.fn()} />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('wraps content in a centered stack when centered is true', () => {
    const RouteError = createRouteErrorBoundary({
      message: 'Centered error',
      context: 'CenteredError',
      centered: true
    })

    render(<RouteError error={testError} retry={vi.fn()} />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('does not show the sign-in button while the user is authenticated', async () => {
    mockGetAuthStatus.mockResolvedValue({isAuthenticated: true})
    const RouteError = createRouteErrorBoundary({
      message: 'Subreddit page error',
      context: 'SubredditPageError'
    })

    render(<RouteError error={testError} retry={vi.fn()} />)

    await waitFor(() => expect(mockGetAuthStatus).toHaveBeenCalled())
    expect(
      screen.queryByRole('link', {name: /sign in with reddit/i})
    ).not.toBeInTheDocument()
  })

  it('shows the sign-in button once confirmed the user is unauthenticated', async () => {
    mockGetAuthStatus.mockResolvedValue({isAuthenticated: false})
    const RouteError = createRouteErrorBoundary({
      message: 'Home page error',
      context: 'MainLayoutError'
    })

    render(<RouteError error={testError} retry={vi.fn()} />)

    expect(
      await screen.findByRole('link', {name: /sign in with reddit/i})
    ).toBeInTheDocument()
  })

  it('keeps the sign-in button hidden when the auth check fails', async () => {
    mockGetAuthStatus.mockRejectedValue(new Error('session read failed'))
    const RouteError = createRouteErrorBoundary({
      message: 'Route error caught',
      context: 'MainLayoutError'
    })

    render(<RouteError error={testError} retry={vi.fn()} />)

    await waitFor(() => expect(mockGetAuthStatus).toHaveBeenCalled())
    expect(
      screen.queryByRole('link', {name: /sign in with reddit/i})
    ).not.toBeInTheDocument()
  })
})
