import {useTrackRecentSubreddit} from '@/lib/hooks/useTrackRecentSubreddit'
import {renderHook} from '@/test-utils'
import {waitFor} from '@testing-library/react'

describe('useTrackRecentSubreddit', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('does nothing if subreddit is falsy', async () => {
    const {store} = renderHook(() => useTrackRecentSubreddit(''))

    await waitFor(() => {
      const state = store.getState()
      expect(state.settings.currentSubreddit).toBe('')
    })
  })

  it('adds subreddit to recent list and sets current subreddit', async () => {
    const subreddit = 'aww'

    const {store} = renderHook(() => useTrackRecentSubreddit(subreddit))

    await waitFor(() => {
      const state = store.getState()
      expect(state.settings.currentSubreddit).toBe('aww')
    })
  })
})
