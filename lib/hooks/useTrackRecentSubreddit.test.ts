import {renderHook} from '@/test-utils/renderHook'
import {useTrackRecentSubreddit} from './useTrackRecentSubreddit'

describe('useTrackRecentSubreddit', () => {
  it('adds subreddit to recent and sets currentSubreddit', () => {
    const {store} = renderHook(() => useTrackRecentSubreddit('test'))
    const state = store.getState()
    expect(state.settings.recent[0].display_name).toBe('test')
    expect(state.settings.currentSubreddit).toBe('test')
  })

  it('does nothing for empty subreddit', () => {
    const preloaded = {
      settings: {
        currentSort: 'hot',
        currentSubreddit: '',
        enableNsfw: true,
        favorites: [],
        isMuted: true,
        recent: []
      }
    }

    const {store} = renderHook(() => useTrackRecentSubreddit(''), {
      preloadedState: preloaded as any
    })

    const state = store.getState()
    expect(state.settings.recent.length).toBe(0)
    expect(state.settings.currentSubreddit).toBe('')
  })
})
