import {render, screen} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'

vi.mock('@/lib/auth/session', () => ({
  isAuthenticated: vi.fn(),
  getSession: vi.fn()
}))

import {getSession, isAuthenticated} from '@/lib/auth/session'
import {PersonalizedNavLinks} from './PersonalizedNavLinks'

const mockIsAuthenticated = vi.mocked(isAuthenticated)
const mockGetSession = vi.mocked(getSession)

describe('PersonalizedNavLinks', () => {
  it('renders nothing when not authenticated', async () => {
    mockIsAuthenticated.mockResolvedValue(false)

    const result = await PersonalizedNavLinks()

    expect(result).toBeNull()
    expect(mockGetSession).not.toHaveBeenCalled()
  })

  it('renders Popular, All, and Saved links when authenticated', async () => {
    mockIsAuthenticated.mockResolvedValue(true)
    mockGetSession.mockResolvedValue({username: 'testuser'} as never)

    render(<>{await PersonalizedNavLinks()}</>)

    const popular = screen.getByRole('link', {name: /popular/i})
    expect(popular).toBeInTheDocument()
    expect(popular).toHaveAttribute('href', '/r/popular')

    const all = screen.getByRole('link', {name: /^all$/i})
    expect(all).toBeInTheDocument()
    expect(all).toHaveAttribute('href', '/r/all')

    const saved = screen.getByRole('link', {name: /saved/i})
    expect(saved).toBeInTheDocument()
    expect(saved).toHaveAttribute('href', '/user/testuser/saved')
  })
})
