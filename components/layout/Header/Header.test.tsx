import {render, screen} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'

vi.mock('@/lib/auth/session', () => ({
  isAuthenticated: vi.fn(),
  getSession: vi.fn()
}))

vi.mock('@/lib/actions/reddit/users', () => ({
  getCurrentUserAvatar: vi.fn()
}))

// Mock child components.
vi.mock('../Logo/Logo', () => ({
  Logo: () => <div data-testid="logo">Viewer for Reddit Logo</div>
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

vi.mock('./MobileSearch', () => ({
  MobileSearch: () => <div data-testid="searchbar">Search</div>
}))

vi.mock('../UserMenu/UserMenu', () => ({
  UserMenu: ({username}: {username?: string}) => (
    <div data-testid="usermenu">
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

import {getCurrentUserAvatar} from '@/lib/actions/reddit/users'
import {getSession, isAuthenticated} from '@/lib/auth/session'
import {Header, HeaderMobileSearch, HeaderUserMenu} from './Header'

const mockIsAuthenticated = vi.mocked(isAuthenticated)
const mockGetSession = vi.mocked(getSession)
const mockGetCurrentUserAvatar = vi.mocked(getCurrentUserAvatar)

// Header wraps HeaderMobileSearch/HeaderUserMenu (both async Server
// Components) in <Suspense>. react-dom's client renderer -- what RTL uses --
// has no RSC-style resolution for async components the way Next.js's real
// pipeline does, so a full <Header/> render only ever shows their fallback
// state here. These tests assert on the static, synchronously-rendered
// chrome; the two deferred components' own auth-branching logic is tested
// directly below by awaiting them.
describe('Header', () => {
  it('renders Logo and toggles synchronously', () => {
    mockIsAuthenticated.mockResolvedValue(false)

    render(<Header />)

    expect(screen.getByTestId('logo')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument()
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
  })

  it('renders navigation toggle buttons', () => {
    mockIsAuthenticated.mockResolvedValue(false)

    render(<Header />)

    expect(
      screen.getByRole('button', {name: /toggle mobile navigation/i})
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {name: /toggle desktop navigation/i})
    ).toBeInTheDocument()
  })
})

describe('HeaderMobileSearch', () => {
  it('renders nothing when not authenticated', async () => {
    mockIsAuthenticated.mockResolvedValue(false)

    render(<>{await HeaderMobileSearch()}</>)

    expect(screen.queryByTestId('searchbar')).not.toBeInTheDocument()
  })

  it('renders MobileSearch when authenticated', async () => {
    mockIsAuthenticated.mockResolvedValue(true)

    render(<>{await HeaderMobileSearch()}</>)

    expect(screen.getByTestId('searchbar')).toBeInTheDocument()
  })
})

describe('HeaderUserMenu', () => {
  it('renders an unauthenticated UserMenu when not authenticated', async () => {
    mockIsAuthenticated.mockResolvedValue(false)

    render(await HeaderUserMenu())

    expect(screen.getByTestId('usermenu-username')).toHaveTextContent('')
    expect(mockGetSession).not.toHaveBeenCalled()
  })

  it('renders UserMenu with the session username and avatar when authenticated', async () => {
    mockIsAuthenticated.mockResolvedValue(true)
    mockGetSession.mockResolvedValue({username: 'testuser'} as never)
    mockGetCurrentUserAvatar.mockResolvedValue('https://example.com/avatar.png')

    render(await HeaderUserMenu())

    expect(screen.getByTestId('usermenu-username')).toHaveTextContent(
      'testuser'
    )
  })
})
