import {render, screen} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {SignInErrorAlert} from './SignInErrorAlert'

describe('SignInErrorAlert', () => {
  it('renders nothing when there is no error', () => {
    render(<SignInErrorAlert />)

    expect(
      screen.queryByText(/sign-in didn't complete/i)
    ).not.toBeInTheDocument()
  })

  it('explains a declined Reddit sign-in prompt for access_denied', () => {
    render(<SignInErrorAlert error="access_denied" />)

    expect(
      screen.getByText(/declined reddit's sign-in prompt/i)
    ).toBeInTheDocument()
  })

  it('shows a specific message for login_failed', () => {
    render(<SignInErrorAlert error="login_failed" />)

    expect(
      screen.getByText(/something went wrong verifying your sign-in request/i)
    ).toBeInTheDocument()
  })

  it('falls back to a generic message for an unrecognized error code', () => {
    render(<SignInErrorAlert error="server_error" />)

    expect(screen.getByText(/sign in when you're ready/i)).toBeInTheDocument()
  })
})
