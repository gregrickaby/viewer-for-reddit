import {render, screen} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'

vi.mock('@/lib/auth/session', () => ({
  isAuthenticated: vi.fn()
}))

vi.mock('@/lib/actions/reddit/multireddits', () => ({
  fetchMultireddits: vi.fn()
}))

vi.mock('@/lib/actions/reddit/subreddits', () => ({
  fetchUserSubscriptions: vi.fn()
}))

vi.mock('@/lib/actions/reddit/users', () => ({
  fetchFollowedUsers: vi.fn()
}))

vi.mock('@/components/layout/Sidebar/SidebarPersonalizedSections', () => ({
  SidebarPersonalizedSections: ({
    subscriptions,
    multireddits,
    following
  }: {
    subscriptions?: unknown[]
    multireddits?: unknown[]
    following?: unknown[]
  }) => (
    <div data-testid="personalized-sections">
      <div data-testid="subscriptions-count">{subscriptions?.length ?? 0}</div>
      <div data-testid="multireddits-count">{multireddits?.length ?? 0}</div>
      <div data-testid="following-count">{following?.length ?? 0}</div>
    </div>
  )
}))

import {fetchMultireddits} from '@/lib/actions/reddit/multireddits'
import {fetchUserSubscriptions} from '@/lib/actions/reddit/subreddits'
import {fetchFollowedUsers} from '@/lib/actions/reddit/users'
import {isAuthenticated} from '@/lib/auth/session'
import {AuthenticatedSidebarSections} from './AuthenticatedSidebarSections'

const mockIsAuthenticated = vi.mocked(isAuthenticated)
const mockFetchMultireddits = vi.mocked(fetchMultireddits)
const mockFetchUserSubscriptions = vi.mocked(fetchUserSubscriptions)
const mockFetchFollowedUsers = vi.mocked(fetchFollowedUsers)

describe('AuthenticatedSidebarSections', () => {
  it('renders nothing when not authenticated', async () => {
    mockIsAuthenticated.mockResolvedValue(false)

    const result = await AuthenticatedSidebarSections()

    expect(result).toBeNull()
    expect(mockFetchUserSubscriptions).not.toHaveBeenCalled()
  })

  it('fetches and renders personalization data when authenticated', async () => {
    mockIsAuthenticated.mockResolvedValue(true)
    mockFetchUserSubscriptions.mockResolvedValue([
      {name: 'programming', displayName: 'r/programming'}
    ] as never)
    mockFetchMultireddits.mockResolvedValue([
      {name: 'tech', displayName: 'Tech', path: '/user/testuser/m/tech'}
    ] as never)
    mockFetchFollowedUsers.mockResolvedValue([
      {name: 'someuser', id: 't2_1', date: 0}
    ] as never)

    render(<>{await AuthenticatedSidebarSections()}</>)

    expect(screen.getByTestId('subscriptions-count')).toHaveTextContent('1')
    expect(screen.getByTestId('multireddits-count')).toHaveTextContent('1')
    expect(screen.getByTestId('following-count')).toHaveTextContent('1')
  })
})
