import {render, screen} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {ErrorDisplay} from './ErrorDisplay'

describe('ErrorDisplay', () => {
  it('renders error message by default (no auth prop)', () => {
    render(<ErrorDisplay />)

    expect(screen.getByText('Sign in to use this website')).toBeInTheDocument()
    expect(
      screen.getByText(/reddit's free api access has been limited/i)
    ).toBeInTheDocument()

    const loginButton = screen.getByRole('link', {name: /sign in with reddit/i})
    expect(loginButton).toBeInTheDocument()
    expect(loginButton).toHaveAttribute('href', '/api/auth/login')
  })

  it('shows login button when user is not authenticated', () => {
    render(<ErrorDisplay isAuthenticated={false} />)

    const loginButton = screen.getByRole('link', {name: /sign in with reddit/i})
    expect(loginButton).toBeInTheDocument()
    expect(loginButton).toHaveAttribute('href', '/api/auth/login')
  })

  it('hides login button when user is authenticated', () => {
    render(<ErrorDisplay isAuthenticated />)

    expect(screen.getByText('Sign in to use this website')).toBeInTheDocument()
    expect(
      screen.queryByRole('link', {name: /sign in with reddit/i})
    ).not.toBeInTheDocument()
  })

  it('includes link to FAQ page', () => {
    render(<ErrorDisplay />)

    const faqLink = screen.getByRole('link', {name: /faq's/i})
    expect(faqLink).toBeInTheDocument()
    expect(faqLink).toHaveAttribute('href', '/about')
  })
})
