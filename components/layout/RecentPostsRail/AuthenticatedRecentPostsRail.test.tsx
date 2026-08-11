import {render, screen} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'

vi.mock('@/lib/auth/session', () => ({
  isAuthenticated: vi.fn()
}))

vi.mock('@/components/layout/RecentPostsRail/RecentPostsRail', () => ({
  RecentPostsRail: () => <div data-testid="recent-posts-rail" />
}))

import {isAuthenticated} from '@/lib/auth/session'
import {AuthenticatedRecentPostsRail} from './AuthenticatedRecentPostsRail'

const mockIsAuthenticated = vi.mocked(isAuthenticated)

describe('AuthenticatedRecentPostsRail', () => {
  it('renders nothing when not authenticated', async () => {
    mockIsAuthenticated.mockResolvedValue(false)

    const result = await AuthenticatedRecentPostsRail()

    expect(result).toBeNull()
  })

  it('renders the rail when authenticated', async () => {
    mockIsAuthenticated.mockResolvedValue(true)

    render(<>{await AuthenticatedRecentPostsRail()}</>)

    expect(screen.getByTestId('recent-posts-rail')).toBeInTheDocument()
  })
})
