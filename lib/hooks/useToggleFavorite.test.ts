import {useToggleFavorite} from '@/lib/hooks/useToggleFavorite'
import {act, renderHook, server, waitFor} from '@/test-utils'
import {notifications} from '@mantine/notifications'
import {http, HttpResponse} from 'msw'

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn()
  }
}))

describe('useToggleFavorite', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('toggles favorite subreddit (add)', async () => {
    const {result, store} = renderHook(() => useToggleFavorite('aww'))

    expect(result.current.isFavorite).toBe(false)
    expect(result.current.loading).toBe(false)

    await act(async () => {
      await result.current.toggle()
    })

    await waitFor(() => {
      const favorites = store.getState().settings.favorites
      expect(favorites.some((f) => f.display_name === 'aww')).toBe(true)
    })

    expect(result.current.loading).toBe(false)

    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Added',
        message: 'r/aww was added to your favorites.',
        color: 'green'
      })
    )
  })

  it('handles API error gracefully', async () => {
    server.use(
      http.get('https://www.reddit.com/r/aww/about.json', () => {
        return new HttpResponse('Not found', {status: 404})
      })
    )

    const {result} = renderHook(() => useToggleFavorite('aww'))

    await act(async () => {
      await result.current.toggle()
    })

    await waitFor(() =>
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          message: 'Failed to update favorite for r/aww',
          color: 'red'
        })
      )
    )
  })
})
