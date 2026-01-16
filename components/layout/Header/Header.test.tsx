import {render, screen} from '@/test-utils'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'
import {Header} from './Header'

// Mock child components
vi.mock('../Logo/Logo', () => ({
  Logo: () => <div data-testid="logo">Reddit Viewer Logo</div>
}))

vi.mock('../SearchBar/SearchBar', () => ({
  SearchBar: ({
    mobileOpen,
    onMobileClose
  }: {
    mobileOpen?: boolean
    onMobileClose?: () => void
  }) => (
    <div data-testid="searchbar">
      <div data-testid="mobile-open">{String(mobileOpen)}</div>
      <button type="button" onClick={onMobileClose}>
        Close Search
      </button>
    </div>
  )
}))

vi.mock('../UserMenu/UserMenu', () => ({
  UserMenu: ({
    isAuthenticated,
    username
  }: {
    isAuthenticated?: boolean
    username?: string
  }) => (
    <div data-testid="usermenu">
      <div data-testid="usermenu-authenticated">{String(isAuthenticated)}</div>
      <div data-testid="usermenu-username">{username}</div>
    </div>
  )
}))

describe('Header', () => {
  describe('rendering', () => {
    it('renders Logo component', () => {
      render(<Header />)

      expect(screen.getByTestId('logo')).toBeInTheDocument()
    })

    it('renders SearchBar component', () => {
      render(<Header />)

      expect(screen.getByTestId('searchbar')).toBeInTheDocument()
    })

    it('renders UserMenu component', () => {
      render(<Header />)

      expect(screen.getByTestId('usermenu')).toBeInTheDocument()
    })

    it('renders mobile navigation toggle button', () => {
      render(<Header />)

      expect(
        screen.getByRole('button', {name: /toggle mobile navigation/i})
      ).toBeInTheDocument()
    })

    it('renders desktop navigation toggle button', () => {
      render(<Header />)

      expect(
        screen.getByRole('button', {name: /toggle desktop navigation/i})
      ).toBeInTheDocument()
    })

    it('renders mobile search button', () => {
      render(<Header />)

      const buttons = screen.getAllByRole('button', {name: /search/i})
      // Should have at least the mobile search button
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('authentication', () => {
    it('passes isAuthenticated to UserMenu', () => {
      render(<Header isAuthenticated />)

      expect(screen.getByTestId('usermenu-authenticated')).toHaveTextContent(
        'true'
      )
    })

    it('passes username to UserMenu', () => {
      render(<Header isAuthenticated username="testuser" />)

      expect(screen.getByTestId('usermenu-username')).toHaveTextContent(
        'testuser'
      )
    })

    it('handles unauthenticated state', () => {
      render(<Header isAuthenticated={false} />)

      expect(screen.getByTestId('usermenu-authenticated')).toHaveTextContent(
        'false'
      )
    })
  })

  describe('navigation toggles', () => {
    it('calls onToggleMobile when mobile burger clicked', async () => {
      const user = userEvent.setup()
      const onToggleMobile = vi.fn()

      render(<Header onToggleMobile={onToggleMobile} />)

      const mobileToggle = screen.getByRole('button', {
        name: /toggle mobile navigation/i
      })
      await user.click(mobileToggle)

      expect(onToggleMobile).toHaveBeenCalledTimes(1)
    })

    it('calls onToggleDesktop when desktop burger clicked', async () => {
      const user = userEvent.setup()
      const onToggleDesktop = vi.fn()

      render(<Header onToggleDesktop={onToggleDesktop} />)

      const desktopToggle = screen.getByRole('button', {
        name: /toggle desktop navigation/i
      })
      await user.click(desktopToggle)

      expect(onToggleDesktop).toHaveBeenCalledTimes(1)
    })

    it('handles multiple clicks on mobile toggle', async () => {
      const user = userEvent.setup()
      const onToggleMobile = vi.fn()

      render(<Header onToggleMobile={onToggleMobile} />)

      const mobileToggle = screen.getByRole('button', {
        name: /toggle mobile navigation/i
      })
      await user.click(mobileToggle)
      await user.click(mobileToggle)
      await user.click(mobileToggle)

      expect(onToggleMobile).toHaveBeenCalledTimes(3)
    })
  })

  describe('mobile search', () => {
    it('opens mobile search when search button clicked', async () => {
      const user = userEvent.setup()
      render(<Header />)

      const searchButtons = screen.getAllByRole('button', {name: /search/i})
      // Click the first search button (mobile)
      await user.click(searchButtons[0])

      expect(screen.getByTestId('mobile-open')).toHaveTextContent('true')
    })

    it('closes mobile search when onMobileClose called', async () => {
      const user = userEvent.setup()
      render(<Header />)

      // Open search
      const searchButtons = screen.getAllByRole('button', {name: /search/i})
      await user.click(searchButtons[0])
      expect(screen.getByTestId('mobile-open')).toHaveTextContent('true')

      // Close search
      const closeButton = screen.getByRole('button', {name: /close search/i})
      await user.click(closeButton)
      expect(screen.getByTestId('mobile-open')).toHaveTextContent('false')
    })

    it('handles multiple open/close cycles', async () => {
      const user = userEvent.setup()
      render(<Header />)

      const searchButtons = screen.getAllByRole('button', {name: /search/i})
      const closeButton = screen.getByRole('button', {name: /close search/i})

      // Open
      await user.click(searchButtons[0])
      expect(screen.getByTestId('mobile-open')).toHaveTextContent('true')

      // Close
      await user.click(closeButton)
      expect(screen.getByTestId('mobile-open')).toHaveTextContent('false')

      // Open again
      await user.click(searchButtons[0])
      expect(screen.getByTestId('mobile-open')).toHaveTextContent('true')
    })
  })

  describe('analytics tracking', () => {
    it('has umami event on mobile navigation toggle', () => {
      render(<Header />)

      const mobileToggle = screen.getByRole('button', {
        name: /toggle mobile navigation/i
      })
      expect(mobileToggle).toHaveAttribute(
        'data-umami-event',
        'toggle-mobile-nav'
      )
    })

    it('has umami event on desktop navigation toggle', () => {
      render(<Header />)

      const desktopToggle = screen.getByRole('button', {
        name: /toggle desktop navigation/i
      })
      expect(desktopToggle).toHaveAttribute(
        'data-umami-event',
        'toggle-desktop-nav'
      )
    })

    it('has umami event on mobile search button', () => {
      render(<Header />)

      const searchButtons = screen.getAllByRole('button', {name: /search/i})
      // Mobile search button should have umami event
      expect(searchButtons[0]).toHaveAttribute(
        'data-umami-event',
        'open-mobile-search'
      )
    })
  })

  describe('all props together', () => {
    it('works with all props provided', async () => {
      const user = userEvent.setup()
      const onToggleMobile = vi.fn()
      const onToggleDesktop = vi.fn()

      render(
        <Header
          isAuthenticated
          username="testuser"
          onToggleMobile={onToggleMobile}
          onToggleDesktop={onToggleDesktop}
        />
      )

      expect(screen.getByTestId('logo')).toBeInTheDocument()
      expect(screen.getByTestId('usermenu-username')).toHaveTextContent(
        'testuser'
      )

      const mobileToggle = screen.getByRole('button', {
        name: /toggle mobile navigation/i
      })
      await user.click(mobileToggle)
      expect(onToggleMobile).toHaveBeenCalledTimes(1)
    })
  })
})
