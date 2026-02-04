import {useLogout} from '@/lib/hooks'
import {render, screen, user} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {UserMenu} from './UserMenu'

vi.mock('@/lib/hooks', () => ({
  useLogout: vi.fn()
}))

const mockUseLogout = vi.mocked(useLogout)

describe('UserMenu', () => {
  const mockHandleLogout = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseLogout.mockReturnValue({
      isLoggingOut: false,
      isPending: false,
      handleLogout: mockHandleLogout
    })
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

    it('calls handleLogout when logout button clicked', async () => {
      render(<UserMenu isAuthenticated username="testuser" />)

      const logoutButton = screen.getAllByRole('button', {name: 'Logout'})[0]
      await user.click(logoutButton)

      expect(mockHandleLogout).toHaveBeenCalledTimes(1)
    })

    it('shows loading state during logout', () => {
      mockUseLogout.mockReturnValue({
        isLoggingOut: true,
        isPending: true,
        handleLogout: mockHandleLogout
      })

      render(<UserMenu isAuthenticated username="testuser" />)

      const logoutButton = screen.getAllByRole('button', {name: 'Logout'})[0]
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
