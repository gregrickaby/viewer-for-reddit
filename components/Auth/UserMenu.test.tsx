import {UserMenu} from '@/components/Auth/UserMenu'
import {render, screen, waitFor} from '@/test-utils'
import {server} from '@/test-utils/msw/server'
import {http, HttpResponse} from 'msw'
import {useRouter} from 'next/navigation'
import {describe, expect, it, vi} from 'vitest'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

describe('UserMenu', () => {
  const mockPush = vi.fn()
  const mockRefresh = vi.fn()

  beforeEach(() => {
    mockPush.mockClear()
    mockRefresh.mockClear()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh
    } as any)
  })

  it('should show loading state initially', () => {
    render(<UserMenu />)
    const avatar = document.querySelector('.mantine-Avatar-root')
    expect(avatar).toBeInTheDocument()
  })

  it('should show login button when not authenticated', async () => {
    render(<UserMenu />)

    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveTextContent('Sign in')
    })
  })

  it('should show user avatar when authenticated', async () => {
    server.use(
      http.get('/api/auth/session', () => {
        return HttpResponse.json({
          username: 'testuser',
          expiresAt: Date.now() + 3600000,
          isAuthenticated: true
        })
      })
    )

    render(<UserMenu />)

    await waitFor(() => {
      const avatar = screen.getByLabelText('User menu for testuser')
      expect(avatar).toBeInTheDocument()
    })
  })

  it('should display correct aria-label with username', async () => {
    server.use(
      http.get('/api/auth/session', () => {
        return HttpResponse.json({
          username: 'testuser',
          expiresAt: Date.now() + 3600000,
          isAuthenticated: true
        })
      })
    )

    render(<UserMenu />)

    await waitFor(() => {
      const avatar = screen.getByLabelText('User menu for testuser')
      expect(avatar).toBeInTheDocument()
    })
  })
})
