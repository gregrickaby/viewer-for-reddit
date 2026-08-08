import {fetchUserInfo} from '@/lib/actions/reddit/users'
import type {RedditUser} from '@/lib/types/reddit'
import {mockObserver} from '@/test-utils/intersectionObserverMock'
import {act, render, screen, waitFor} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {useUserAvatar} from './useUserAvatar'

vi.mock('@/lib/actions/reddit/users', () => ({
  fetchUserInfo: vi.fn()
}))

const mockFetchUserInfo = vi.mocked(fetchUserInfo)

beforeEach(() => {
  mockFetchUserInfo.mockClear()
})

function makeUser(iconImg: string): RedditUser {
  return {
    name: 'someuser',
    id: 't2_123',
    icon_img: iconImg,
    created_utc: 0,
    link_karma: 0,
    comment_karma: 0,
    total_karma: 0,
    is_gold: false,
    is_mod: false,
    has_verified_email: true
  }
}

interface TestProps {
  username: string | null
}

function AvatarHost({username}: Readonly<TestProps>) {
  const {avatarUrl, ref} = useUserAvatar(username)
  return (
    <div ref={ref} data-testid="host">
      {avatarUrl ?? 'none'}
    </div>
  )
}

describe('useUserAvatar', () => {
  it('does not observe or fetch when username is null', () => {
    render(<AvatarHost username={null} />)

    expect(mockObserver.observe).not.toHaveBeenCalled()
    expect(mockFetchUserInfo).not.toHaveBeenCalled()
  })

  it('fetches and resolves the avatar URL once the element intersects', async () => {
    mockFetchUserInfo.mockResolvedValueOnce(
      makeUser('https://example.com/avatar-a.png')
    )

    render(<AvatarHost username="avatar-user-a" />)

    expect(mockObserver.observe).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('host')).toHaveTextContent('none')

    act(() => {
      mockObserver._trigger(true)
    })

    await waitFor(() =>
      expect(screen.getByTestId('host')).toHaveTextContent(
        'https://example.com/avatar-a.png'
      )
    )
    expect(mockFetchUserInfo).toHaveBeenCalledWith('avatar-user-a')
  })

  it('does not fetch when the element has not intersected', () => {
    render(<AvatarHost username="avatar-user-b" />)

    act(() => {
      mockObserver._trigger(false)
    })

    expect(mockFetchUserInfo).not.toHaveBeenCalled()
  })

  it('resolves to null when fetchUserInfo rejects', async () => {
    mockFetchUserInfo.mockRejectedValueOnce(new Error('boom'))

    render(<AvatarHost username="avatar-user-c" />)

    act(() => {
      mockObserver._trigger(true)
    })

    await waitFor(() =>
      expect(screen.getByTestId('host')).toHaveTextContent('none')
    )
  })

  it('caches a resolved avatar so a second instance for the same user skips fetching', async () => {
    mockFetchUserInfo.mockResolvedValueOnce(
      makeUser('https://example.com/avatar-d.png')
    )

    const {unmount} = render(<AvatarHost username="avatar-user-d" />)

    act(() => {
      mockObserver._trigger(true)
    })

    await waitFor(() =>
      expect(screen.getByTestId('host')).toHaveTextContent(
        'https://example.com/avatar-d.png'
      )
    )

    unmount()

    render(<AvatarHost username="avatar-user-d" />)

    expect(screen.getByTestId('host')).toHaveTextContent(
      'https://example.com/avatar-d.png'
    )
    expect(mockFetchUserInfo).toHaveBeenCalledTimes(1)
  })

  it('disconnects the observer on unmount', () => {
    const {unmount} = render(<AvatarHost username="avatar-user-e" />)

    expect(mockObserver.observe).toHaveBeenCalledTimes(1)

    unmount()

    expect(mockObserver.disconnect).toHaveBeenCalledTimes(1)
  })
})
