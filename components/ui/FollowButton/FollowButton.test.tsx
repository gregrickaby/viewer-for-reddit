import {render, screen, user} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {FollowButton} from './FollowButton'

vi.mock('@/lib/hooks/useFollowUser', () => ({
  useFollowUser: vi.fn()
}))

const {useFollowUser} = await import('@/lib/hooks/useFollowUser')

describe('FollowButton', () => {
  it('renders Follow button when not following', () => {
    vi.mocked(useFollowUser).mockReturnValue({
      isFollowing: false,
      isPending: false,
      toggleFollow: vi.fn()
    })

    render(<FollowButton username="testuser" initialIsFollowing={false} />)

    const button = screen.getByRole('button', {name: /follow u\/testuser/i})
    expect(button).toBeInTheDocument()
    expect(button).toBeEnabled()
    expect(screen.getByText('Follow')).toBeInTheDocument()
  })

  it('renders Following button when already following', () => {
    vi.mocked(useFollowUser).mockReturnValue({
      isFollowing: true,
      isPending: false,
      toggleFollow: vi.fn()
    })

    render(<FollowButton username="testuser" initialIsFollowing />)

    const button = screen.getByRole('button', {name: /unfollow u\/testuser/i})
    expect(button).toBeInTheDocument()
    expect(button).toBeEnabled()
    expect(screen.getByText('Following')).toBeInTheDocument()
  })

  it('calls toggleFollow when clicked', async () => {
    const mockToggleFollow = vi.fn()
    vi.mocked(useFollowUser).mockReturnValue({
      isFollowing: false,
      isPending: false,
      toggleFollow: mockToggleFollow
    })

    render(<FollowButton username="testuser" initialIsFollowing={false} />)

    await user.click(screen.getByRole('button', {name: /follow u\/testuser/i}))

    expect(mockToggleFollow).toHaveBeenCalledTimes(1)
  })

  it('is disabled while pending', () => {
    vi.mocked(useFollowUser).mockReturnValue({
      isFollowing: false,
      isPending: true,
      toggleFollow: vi.fn()
    })

    render(<FollowButton username="testuser" initialIsFollowing={false} />)

    expect(
      screen.getByRole('button', {name: /follow u\/testuser/i})
    ).toBeDisabled()
  })

  it('passes correct props to useFollowUser hook', () => {
    const mockUseFollowUser = vi.mocked(useFollowUser)
    mockUseFollowUser.mockReturnValue({
      isFollowing: false,
      isPending: false,
      toggleFollow: vi.fn()
    })

    render(<FollowButton username="spez" initialIsFollowing />)

    expect(mockUseFollowUser).toHaveBeenCalledWith({
      username: 'spez',
      initialIsFollowing: true
    })
  })
})
