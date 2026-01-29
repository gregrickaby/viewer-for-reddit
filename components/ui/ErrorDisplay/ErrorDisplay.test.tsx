import {render, screen} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {ErrorDisplay} from './ErrorDisplay'

describe('ErrorDisplay', () => {
  it('renders error alert with ordered list by default (no auth prop)', () => {
    render(<ErrorDisplay />)

    // Verify alert structure
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    // Verify list exists (not specific content)
    const list = document.querySelector('ol')
    expect(list).toBeInTheDocument()

    // Verify login button appears for unauthenticated
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

    // Alert and list should still render
    expect(screen.getByRole('alert')).toBeInTheDocument()
    const list = document.querySelector('ol')
    expect(list).toBeInTheDocument()

    // Login button should NOT appear
    expect(
      screen.queryByRole('link', {name: /sign in with reddit/i})
    ).not.toBeInTheDocument()
  })
})
