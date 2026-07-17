import {useLogout} from '@/lib/hooks/useLogout'
import {render, screen, user} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {UserMenu} from './UserMenu'

vi.mock('@/lib/hooks/useLogout', () => ({
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
          username="testuser"
          avatarUrl="https://example.com/avatar.jpg"
        />
      )

      const avatarLink = screen.getByRole('link', {
        name: "Go to testuser's profile"
      })
      expect(avatarLink).toBeInTheDocument()
      expect(avatarLink).toHaveAttribute('href', '/u/testuser')
    })

    it('does not render avatar when no avatar URL provided', () => {
      render(<UserMenu username="testuser" />)

      const avatarLink = screen.queryByRole('link', {
        name: "Go to testuser's profile"
      })
      expect(avatarLink).not.toBeInTheDocument()
    })

    it('renders logout button when authenticated', () => {
      render(<UserMenu username="testuser" />)

      const logoutButtons = screen.getAllByRole('button', {name: 'Logout'})
      expect(logoutButtons.length).toBeGreaterThan(0)
    })

    it('calls handleLogout when logout button clicked', async () => {
      render(<UserMenu username="testuser" />)

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

      render(<UserMenu username="testuser" />)

      const logoutButton = screen.getAllByRole('button', {name: 'Logout'})[0]
      expect(logoutButton).toHaveAttribute('data-loading', 'true')
    })
  })
})
