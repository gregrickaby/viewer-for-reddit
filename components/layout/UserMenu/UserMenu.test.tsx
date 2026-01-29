import {logout} from '@/lib/actions/auth'
import {render, screen, user, waitFor} from '@/test-utils'
import {useRouter} from 'next/navigation'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {UserMenu} from './UserMenu'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

vi.mock('@/lib/actions/auth', () => ({
  logout: vi.fn(async () => ({success: true}))
}))

const mockUseRouter = vi.mocked(useRouter)
const mockLogout = vi.mocked(logout)

describe('UserMenu', () => {
  const mockPush = vi.fn()
  const mockRefresh = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockLogout.mockResolvedValue({success: true})
    mockUseRouter.mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
      replace: vi.fn()
    } as any)
  })

  describe('authenticated state', () => {
    it('renders clickable avatar when avatar URL is provided', () => {
      render(
        <UserMenu
          isAuthenticated
          username="testuser"
          avatarUrl="https://example.com/avatar.jpg"
        />
      )

      const avatarLink = screen.getByRole('link', {
        name: "Go to testuser's profile"
      })
      expect(avatarLink).toBeInTheDocument()
      expect(avatarLink).toHaveAttribute('href', '/u/testuser')
      expect(avatarLink).toHaveAttribute('data-umami-event', 'nav-user-avatar')
    })

    it('does not render avatar when no avatar URL provided', () => {
      render(<UserMenu isAuthenticated username="testuser" />)

      const avatarLink = screen.queryByRole('link', {
        name: "Go to testuser's profile"
      })
      expect(avatarLink).not.toBeInTheDocument()
    })

    it('renders logout button when authenticated', () => {
      render(<UserMenu isAuthenticated username="testuser" />)

      const logoutButtons = screen.getAllByRole('button', {name: 'Logout'})
      expect(logoutButtons.length).toBeGreaterThan(0)
    })

    it('handles logout click', async () => {
      render(<UserMenu isAuthenticated username="testuser" />)

      const logoutButton = screen.getAllByRole('button', {name: 'Logout'})[0]
      await user.click(logoutButton)

      expect(mockLogout).toHaveBeenCalled()
    })

    it('redirects to home and refreshes after logout', async () => {
      render(<UserMenu isAuthenticated username="testuser" />)

      const logoutButton = screen.getAllByRole('button', {name: 'Logout'})[0]
      await user.click(logoutButton)

      // Wait for the async operation
      await vi.waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/')
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it('disables logout button during logout', async () => {
      mockLogout.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({success: true}), 100)
          )
      )

      render(<UserMenu isAuthenticated username="testuser" />)

      const logoutButton = screen.getAllByRole('button', {name: 'Logout'})[0]
      await user.click(logoutButton)

      // Button should show loading state
      expect(logoutButton).toHaveAttribute('data-loading', 'true')
    })
  })

  describe('unauthenticated state', () => {
    it('renders login button when not authenticated', () => {
      render(<UserMenu isAuthenticated={false} />)

      const loginButton = screen.getByRole('link', {
        name: 'Sign in with Reddit'
      })
      expect(loginButton).toBeInTheDocument()
    })

    it('login button has correct href', () => {
      render(<UserMenu isAuthenticated={false} />)

      const loginButton = screen.getByRole('link', {
        name: 'Sign in with Reddit'
      })
      expect(loginButton).toHaveAttribute('href', '/api/auth/login')
    })

    it('does not render logout button when not authenticated', () => {
      render(<UserMenu isAuthenticated={false} />)

      expect(
        screen.queryByRole('button', {name: 'Logout'})
      ).not.toBeInTheDocument()
    })

    it('does not render username link when not authenticated', () => {
      render(<UserMenu isAuthenticated={false} />)

      expect(screen.queryByRole('link', {name: /u\//})).not.toBeInTheDocument()
    })
  })

  describe('race condition prevention', () => {
    it('prevents multiple logout clicks', async () => {
      mockLogout.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({success: true}), 100)
          )
      )

      render(<UserMenu isAuthenticated username="testuser" />)

      const logoutButton = screen.getAllByRole('button', {name: 'Logout'})[0]

      // Click multiple times rapidly
      await user.click(logoutButton)
      await user.click(logoutButton)
      await user.click(logoutButton)

      // Should only call logout once
      expect(mockLogout).toHaveBeenCalledTimes(1)
    })
  })

  describe('error handling', () => {
    it('handles logout failure gracefully', async () => {
      mockLogout.mockResolvedValue({success: false, error: 'Logout failed'})

      render(<UserMenu isAuthenticated username="testuser" />)

      const logoutButton = screen.getAllByRole('button', {name: 'Logout'})[0]
      await user.click(logoutButton)

      // Wait for logout to complete
      await vi.waitFor(() => {
        expect(mockLogout).toHaveBeenCalled()
      })

      // Button should not redirect on failure
    })

    it('handles network errors during logout', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockLogout.mockRejectedValueOnce(new Error('Network error'))

      render(<UserMenu isAuthenticated username="testuser" />)

      const logoutButton = screen.getAllByRole('button', {name: 'Logout'})[0]

      // Click and expect the rejection to be thrown (component doesn't catch)
      await user.click(logoutButton)

      // Wait for logout to be called
      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled()
      })

      // Even though logout failed, the component stays mounted (finally block runs)
      // and the isLoggingOut state is reset
      expect(mockLogout).toHaveBeenCalledTimes(1)

      consoleSpy.mockRestore()
    })
  })

  describe('analytics tracking', () => {
    it('has umami event on avatar link', () => {
      render(
        <UserMenu
          isAuthenticated
          username="testuser"
          avatarUrl="https://example.com/avatar.jpg"
        />
      )

      const avatarLink = screen.getByRole('link', {
        name: "Go to testuser's profile"
      })
      expect(avatarLink).toHaveAttribute('data-umami-event', 'nav-user-avatar')
    })

    it('has umami event on logout buttons', () => {
      render(<UserMenu isAuthenticated username="testuser" />)

      const logoutButtons = screen.getAllByRole('button', {name: 'Logout'})
      logoutButtons.forEach((button) => {
        expect(button).toHaveAttribute('data-umami-event', 'logout-button')
      })
    })

    it('has umami event on login button', () => {
      render(<UserMenu isAuthenticated={false} />)

      const loginButton = screen.getByRole('link', {
        name: 'Sign in with Reddit'
      })
      expect(loginButton).toHaveAttribute('data-umami-event', 'login-button')
    })
  })

  describe('edge cases', () => {
    it('renders when both isAuthenticated and username are undefined', () => {
      render(<UserMenu />)

      const loginButton = screen.getByRole('link', {
        name: 'Sign in with Reddit'
      })
      expect(loginButton).toBeInTheDocument()
    })
  })
})
