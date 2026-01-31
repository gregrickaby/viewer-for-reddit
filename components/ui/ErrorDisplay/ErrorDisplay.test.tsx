import {render, screen} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {ErrorDisplay} from './ErrorDisplay'

describe('ErrorDisplay', () => {
  it('renders error message by default (no auth prop)', () => {
    render(<ErrorDisplay />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(
      screen.getByText(/sign in to remove rate limits or try again later/i)
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

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(
      screen.queryByRole('link', {name: /sign in with reddit/i})
    ).not.toBeInTheDocument()
  })
})
