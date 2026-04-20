import {render, screen} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {Shell} from './Shell'

// Mock child components to isolate Shell tests.
vi.mock('../Header/Header', () => ({
  Header: ({
    isAuthenticated,
    username
  }: {
    isAuthenticated?: boolean
    username?: string
  }) => (
    <div data-testid="header">
      <div data-testid="is-authenticated">{String(isAuthenticated)}</div>
      <div data-testid="username">{username}</div>
    </div>
  )
}))

vi.mock('../Sidebar/SidebarPanel', () => ({
  SidebarPanel: ({
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
    <aside data-testid="sidebar-panel">
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
    </aside>
  )
}))

vi.mock('../Sidebar/SidebarContext', () => ({
  SidebarProvider: ({children}: {children: React.ReactNode}) => (
    <div data-testid="sidebar-provider">{children}</div>
  )
}))

describe('Shell', () => {
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
        <Shell>
          <div>Test Content</div>
        </Shell>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('renders Header component', () => {
      render(<Shell>Content</Shell>)

      expect(screen.getByTestId('header')).toBeInTheDocument()
    })

    it('renders SidebarPanel component', () => {
      render(<Shell>Content</Shell>)

      expect(screen.getByTestId('sidebar-panel')).toBeInTheDocument()
    })

    it('wraps content in SidebarProvider', () => {
      render(<Shell>Content</Shell>)

      expect(screen.getByTestId('sidebar-provider')).toBeInTheDocument()
    })

    it('renders semantic HTML elements', () => {
      render(<Shell>Content</Shell>)

      expect(
        screen.getByRole('banner') // <header>
      ).toBeInTheDocument()
      expect(
        screen.getByRole('main') // <main>
      ).toBeInTheDocument()
    })
  })

  describe('authentication', () => {
    it('passes isAuthenticated to Header', () => {
      render(<Shell isAuthenticated>Content</Shell>)

      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')
    })

    it('passes username to Header', () => {
      render(
        <Shell isAuthenticated username="testuser">
          Content
        </Shell>
      )

      expect(screen.getByTestId('username')).toHaveTextContent('testuser')
    })

    it('passes isAuthenticated to SidebarPanel', () => {
      render(<Shell isAuthenticated>Content</Shell>)

      expect(screen.getByTestId('sidebar-authenticated')).toHaveTextContent(
        'true'
      )
    })

    it('handles unauthenticated state', () => {
      render(<Shell isAuthenticated={false}>Content</Shell>)

      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('sidebar-authenticated')).toHaveTextContent(
        'false'
      )
    })
  })

  describe('subscriptions', () => {
    it('passes subscriptions to SidebarPanel', () => {
      render(<Shell subscriptions={mockSubscriptions}>Content</Shell>)

      expect(screen.getByTestId('sidebar-subscriptions')).toHaveTextContent(
        '2 subscriptions'
      )
    })

    it('handles empty subscriptions array', () => {
      render(<Shell subscriptions={[]}>Content</Shell>)

      expect(screen.getByTestId('sidebar-subscriptions')).toHaveTextContent(
        '0 subscriptions'
      )
    })

    it('handles undefined subscriptions', () => {
      render(<Shell>Content</Shell>)

      expect(
        screen.queryByTestId('sidebar-subscriptions')
      ).not.toBeInTheDocument()
    })
  })

  describe('multireddits', () => {
    it('passes multireddits to SidebarPanel', () => {
      render(<Shell multireddits={mockMultireddits}>Content</Shell>)

      expect(screen.getByTestId('sidebar-multireddits')).toHaveTextContent(
        '1 multireddits'
      )
    })

    it('handles empty multireddits array', () => {
      render(<Shell multireddits={[]}>Content</Shell>)

      expect(screen.getByTestId('sidebar-multireddits')).toHaveTextContent(
        '0 multireddits'
      )
    })

    it('handles undefined multireddits', () => {
      render(<Shell>Content</Shell>)

      expect(
        screen.queryByTestId('sidebar-multireddits')
      ).not.toBeInTheDocument()
    })
  })

  describe('all props together', () => {
    it('passes all props correctly', () => {
      render(
        <Shell
          isAuthenticated
          username="testuser"
          subscriptions={mockSubscriptions}
          multireddits={mockMultireddits}
        >
          <div>All Props Test</div>
        </Shell>
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
