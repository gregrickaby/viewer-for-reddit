import {logger} from '@/lib/datadog/client'
import {addNextjsError} from '@datadog/browser-rum-nextjs'
import {render, screen, user} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {createRouteErrorBoundary} from './RouteErrorBoundary'

const testError = Object.assign(new Error('boom'), {digest: 'abc123'})

describe('createRouteErrorBoundary', () => {
  it('logs to Datadog with the configured message and context', () => {
    const RouteError = createRouteErrorBoundary({
      message: 'Search page error',
      context: 'SearchPageError'
    })

    render(<RouteError error={testError} reset={vi.fn()} />)

    expect(addNextjsError).toHaveBeenCalledWith(testError)
    expect(logger.error).toHaveBeenCalledWith('Search page error', {
      error: 'boom',
      context: 'SearchPageError',
      digest: 'abc123'
    })
  })

  it('renders ErrorDisplay and wires reset to the Try Again button', async () => {
    const reset = vi.fn()
    const RouteError = createRouteErrorBoundary({
      message: 'Donate page error',
      context: 'DonatePageError',
      containerSize: 'md',
      containerPy: 'xl'
    })

    render(<RouteError error={testError} reset={reset} />)

    await user.click(screen.getByRole('button', {name: /try again/i}))
    expect(reset).toHaveBeenCalledOnce()
  })

  it('renders unwrapped when no containerSize is configured', () => {
    const RouteError = createRouteErrorBoundary({
      message: 'Route error caught',
      context: 'MainLayoutError'
    })

    render(<RouteError error={testError} reset={vi.fn()} />)

    expect(screen.getByText('Sign in to use this website')).toBeInTheDocument()
  })
})
