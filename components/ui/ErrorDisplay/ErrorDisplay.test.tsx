import {render, screen} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {ErrorDisplay} from './ErrorDisplay'

describe('ErrorDisplay', () => {
  it('renders default content', () => {
    render(<ErrorDisplay />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(
      screen.getByText('Please try again in a moment.')
    ).toBeInTheDocument()
  })

  it('renders custom title and message', () => {
    render(<ErrorDisplay title="Custom title" message="Custom message" />)

    expect(screen.getByText('Custom title')).toBeInTheDocument()
    expect(screen.getByText('Custom message')).toBeInTheDocument()
  })

  it('renders error digest with report link when provided', () => {
    render(<ErrorDisplay digest="abc123" />)

    expect(screen.getByText(/Error ID:/)).toBeInTheDocument()
    expect(screen.getByText('abc123')).toBeInTheDocument()
    expect(screen.getByText('Report issue')).toBeInTheDocument()
    expect(screen.getByText('Report issue')).toHaveAttribute(
      'href',
      'https://github.com/gregrickaby/viewer-for-reddit/issues'
    )
  })

  it('does not render digest section when not provided', () => {
    render(<ErrorDisplay />)

    expect(screen.queryByText(/Error ID:/)).not.toBeInTheDocument()
  })

  describe('login button', () => {
    it('shows login button for rate limit errors', () => {
      render(
        <ErrorDisplay message="Rate limit exceeded. Please log in to continue." />
      )

      expect(screen.getByText('Log in with Reddit')).toBeInTheDocument()
      expect(
        screen.getByText('Log in with Reddit').closest('a')
      ).toHaveAttribute('href', '/api/auth/login')
    })

    it('shows login button when message mentions "log in"', () => {
      render(<ErrorDisplay message="Please log in to continue." />)

      expect(screen.getByText('Log in with Reddit')).toBeInTheDocument()
    })

    it('shows login button when message mentions "logging in"', () => {
      render(
        <ErrorDisplay message="Logging in may help increase your limit." />
      )

      expect(screen.getByText('Log in with Reddit')).toBeInTheDocument()
    })

    it('shows login button for authentication errors', () => {
      render(<ErrorDisplay message="Authentication required." />)

      expect(screen.getByText('Log in with Reddit')).toBeInTheDocument()
    })

    it('shows login button for expired session errors', () => {
      render(<ErrorDisplay message="Your session has expired." />)

      expect(screen.getByText('Log in with Reddit')).toBeInTheDocument()
    })

    it('does not show login button for generic errors', () => {
      render(<ErrorDisplay message="Something went wrong." />)

      expect(screen.queryByText('Log in with Reddit')).not.toBeInTheDocument()
    })

    it('respects explicit showLoginButton=true prop', () => {
      render(<ErrorDisplay message="Generic error" showLoginButton />)

      expect(screen.getByText('Log in with Reddit')).toBeInTheDocument()
    })

    it('respects explicit showLoginButton=false prop', () => {
      render(
        <ErrorDisplay message="Rate limit exceeded" showLoginButton={false} />
      )

      expect(screen.queryByText('Log in with Reddit')).not.toBeInTheDocument()
    })

    it('displays OAuth explanation text with login button', () => {
      render(<ErrorDisplay message="Rate limit exceeded." />)

      expect(
        screen.getByText(/Authenticated users have higher rate limits/)
      ).toBeInTheDocument()
      expect(screen.getByText('official Reddit oAuth2 API')).toBeInTheDocument()
      expect(screen.getByText('official Reddit oAuth2 API')).toHaveAttribute(
        'href',
        'https://github.com/reddit-archive/reddit/wiki/OAuth2'
      )
    })
  })
})
