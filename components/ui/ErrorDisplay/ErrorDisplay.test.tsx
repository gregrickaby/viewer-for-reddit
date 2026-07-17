import {render, screen} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {ErrorDisplay} from './ErrorDisplay'

describe('ErrorDisplay', () => {
  it('renders error message and login button', () => {
    render(<ErrorDisplay />)

    expect(screen.getByText('Sign in to use this website')).toBeInTheDocument()
    expect(
      screen.getByText(/reddit's free api access has been limited/i)
    ).toBeInTheDocument()

    const loginButton = screen.getByRole('link', {name: /sign in with reddit/i})
    expect(loginButton).toBeInTheDocument()
    expect(loginButton).toHaveAttribute('href', '/api/auth/login')
  })

  it('includes link to FAQ page', () => {
    render(<ErrorDisplay />)

    const faqLink = screen.getByRole('link', {name: /faq's/i})
    expect(faqLink).toBeInTheDocument()
    expect(faqLink).toHaveAttribute('href', '/about')
  })
})
