import {render, screen} from '@/test-utils'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'
import {AppLayout} from './AppLayout'

// Mock child components
vi.mock('../Header/Header', () => ({
  Header: ({
    isAuthenticated,
    username,
    mobileOpened,
    onToggleMobile,
    onToggleDesktop
  }: {
    isAuthenticated?: boolean
    username?: string
    mobileOpened?: boolean
    onToggleMobile?: () => void
    onToggleDesktop?: () => void
  }) => (
    <div data-testid="header">
      <div data-testid="is-authenticated">{String(isAuthenticated)}</div>
      <div data-testid="username">{username}</div>
      <div data-testid="mobile-opened">{String(mobileOpened)}</div>
      <button type="button" onClick={onToggleMobile}>
        Toggle Mobile
      </button>
      <button type="button" onClick={onToggleDesktop}>
        Toggle Desktop
      </button>
    </div>
  )
}))

vi.mock('../Sidebar/Sidebar', () => ({
  Sidebar: ({
    isAuthenticated,
    subscriptions,
    multireddits
  }: {
    isAuthenticated?: boolean
    subscriptions?: Array<{name: string; displayName: string; icon?: string}>
    multireddits?: Array<{
      name: string
      displayName: string
      path: string
      subreddits: string[]
      icon?: string
    }>
  }) => (
    <div data-testid="sidebar">
      <div data-testid="sidebar-authenticated">{String(isAuthenticated)}</div>
      {subscriptions && (
        <div data-testid="sidebar-subscriptions">
          {subscriptions.length} subscriptions
        </div>
      )}
      {multireddits && (
        <div data-testid="sidebar-multireddits">
          {multireddits.length} multireddits
        </div>
      )}
    </div>
  )
}))

describe('AppLayout', () => {
  const mockSubscriptions = [
    {name: 'programming', displayName: 'r/programming', icon: 'icon1.png'},
    {name: 'javascript', displayName: 'r/javascript'}
  ]

  const mockMultireddits = [
    {
      name: 'tech',
      displayName: 'Tech News',
      path: '/user/testuser/m/tech',
      subreddits: []
    }
  ]

  describe('rendering', () => {
    it('renders children content', () => {
      render(
        <AppLayout>
          <div>Test Content</div>
        </AppLayout>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('renders Header component', () => {
      render(<AppLayout>Content</AppLayout>)

      expect(screen.getByTestId('header')).toBeInTheDocument()
    })

    it('renders Sidebar component', () => {
      render(<AppLayout>Content</AppLayout>)

      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    })
  })

  describe('authentication', () => {
    it('passes isAuthenticated to Header', () => {
      render(<AppLayout isAuthenticated>Content</AppLayout>)

      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')
    })

    it('passes username to Header', () => {
      render(
        <AppLayout isAuthenticated username="testuser">
          Content
        </AppLayout>
      )

      expect(screen.getByTestId('username')).toHaveTextContent('testuser')
    })

    it('passes isAuthenticated to Sidebar', () => {
      render(<AppLayout isAuthenticated>Content</AppLayout>)

      expect(screen.getByTestId('sidebar-authenticated')).toHaveTextContent(
        'true'
      )
    })

    it('handles unauthenticated state', () => {
      render(<AppLayout isAuthenticated={false}>Content</AppLayout>)

      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('sidebar-authenticated')).toHaveTextContent(
        'false'
      )
    })
  })

  describe('subscriptions', () => {
    it('passes subscriptions to Sidebar', () => {
      render(<AppLayout subscriptions={mockSubscriptions}>Content</AppLayout>)

      expect(screen.getByTestId('sidebar-subscriptions')).toHaveTextContent(
        '2 subscriptions'
      )
    })

    it('handles empty subscriptions array', () => {
      render(<AppLayout subscriptions={[]}>Content</AppLayout>)

      expect(screen.getByTestId('sidebar-subscriptions')).toHaveTextContent(
        '0 subscriptions'
      )
    })

    it('handles undefined subscriptions', () => {
      render(<AppLayout>Content</AppLayout>)

      expect(
        screen.queryByTestId('sidebar-subscriptions')
      ).not.toBeInTheDocument()
    })
  })

  describe('multireddits', () => {
    it('passes multireddits to Sidebar', () => {
      render(<AppLayout multireddits={mockMultireddits}>Content</AppLayout>)

      expect(screen.getByTestId('sidebar-multireddits')).toHaveTextContent(
        '1 multireddits'
      )
    })

    it('handles empty multireddits array', () => {
      render(<AppLayout multireddits={[]}>Content</AppLayout>)

      expect(screen.getByTestId('sidebar-multireddits')).toHaveTextContent(
        '0 multireddits'
      )
    })

    it('handles undefined multireddits', () => {
      render(<AppLayout>Content</AppLayout>)

      expect(
        screen.queryByTestId('sidebar-multireddits')
      ).not.toBeInTheDocument()
    })
  })

  describe('mobile drawer state', () => {
    it('starts with mobile drawer closed', () => {
      render(<AppLayout>Content</AppLayout>)

      expect(screen.getByTestId('mobile-opened')).toHaveTextContent('false')
    })

    it('toggles mobile drawer state when toggle button clicked', async () => {
      const user = userEvent.setup()
      render(<AppLayout>Content</AppLayout>)

      expect(screen.getByTestId('mobile-opened')).toHaveTextContent('false')

      const toggleButton = screen.getByRole('button', {name: /toggle mobile/i})
      await user.click(toggleButton)

      expect(screen.getByTestId('mobile-opened')).toHaveTextContent('true')
    })
  })

  describe('all props together', () => {
    it('passes all props correctly', () => {
      render(
        <AppLayout
          isAuthenticated
          username="testuser"
          subscriptions={mockSubscriptions}
          multireddits={mockMultireddits}
        >
          <div>All Props Test</div>
        </AppLayout>
      )

      expect(screen.getByText('All Props Test')).toBeInTheDocument()
      expect(screen.getByTestId('username')).toHaveTextContent('testuser')
      expect(screen.getByTestId('sidebar-subscriptions')).toHaveTextContent(
        '2 subscriptions'
      )
      expect(screen.getByTestId('sidebar-multireddits')).toHaveTextContent(
        '1 multireddits'
      )
    })
  })
})
