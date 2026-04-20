import {render, screen} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {Header} from './Header'

// Mock child components.
vi.mock('../Logo/Logo', () => ({
  Logo: () => <div data-testid="logo">Reddit Viewer Logo</div>
}))

vi.mock('../Sidebar/SidebarToggle', () => ({
  SidebarToggle: () => (
    <div data-testid="sidebar-toggle">
      <button type="button" aria-label="Toggle mobile navigation">
        Mobile
      </button>
      <button type="button" aria-label="Toggle desktop navigation">
        Desktop
      </button>
    </div>
  )
}))

vi.mock('@/components/ui/SearchBar/SearchBar', () => ({
  SearchBar: () => <div data-testid="searchbar">Search</div>
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

vi.mock('@/components/ui/ThemeToggle/ThemeToggle', () => ({
  ThemeToggle: () => (
    <button type="button" data-testid="theme-toggle">
      Theme Toggle
    </button>
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

    it('renders SidebarToggle component', () => {
      render(<Header />)

      expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument()
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

  describe('theme toggle', () => {
    it('renders theme toggle button', () => {
      render(<Header />)

      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
    })
  })

  describe('all props together', () => {
    it('works with all props provided', () => {
      render(<Header isAuthenticated username="testuser" />)

      expect(screen.getByTestId('logo')).toBeInTheDocument()
      expect(screen.getByTestId('usermenu-username')).toHaveTextContent(
        'testuser'
      )
      expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument()
    })
  })
})
