import {render, screen, user} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {ErrorDisplay} from './ErrorDisplay'

describe('ErrorDisplay', () => {
  it('renders a generic message with no sign-in button by default', () => {
    render(<ErrorDisplay />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(
      screen.queryByRole('link', {name: /sign in with reddit/i})
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('Sign in to use this website')
    ).not.toBeInTheDocument()
  })

  it('renders sign-in messaging and button when showSignIn is true', () => {
    render(<ErrorDisplay showSignIn />)

    expect(screen.getByText('Sign in to use this website')).toBeInTheDocument()
    expect(
      screen.getByText(/reddit no longer allows free access/i)
    ).toBeInTheDocument()

    const loginButton = screen.getByRole('link', {name: /sign in with reddit/i})
    expect(loginButton).toBeInTheDocument()
    expect(loginButton).toHaveAttribute('href', '/api/auth/login')
  })

  it('omits the Try Again button when no onRetry is provided', () => {
    render(<ErrorDisplay />)

    expect(
      screen.queryByRole('button', {name: /try again/i})
    ).not.toBeInTheDocument()
  })

  it('calls onRetry when Try Again is clicked', async () => {
    const onRetry = vi.fn()
    render(<ErrorDisplay onRetry={onRetry} />)

    await user.click(screen.getByRole('button', {name: /try again/i}))

    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('includes link to FAQ page', () => {
    render(<ErrorDisplay />)

    const faqLink = screen.getByRole('link', {name: /faq's/i})
    expect(faqLink).toBeInTheDocument()
    expect(faqLink).toHaveAttribute('href', '/about')
  })
})
