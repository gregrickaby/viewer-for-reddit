import {act, mockPreloadedState, renderHook} from '@/test-utils'
import {useSidebarSection} from './useSidebarSection'

const subreddit: any = {
  display_name: 'reactjs',
  icon_img: '',
  over18: false,
  public_description: 'React community',
  subscribers: 100000,
  value: 'r/reactjs'
}

const subreddit2: any = {
  display_name: 'aww',
  icon_img: '',
  over18: false,
  public_description: 'Cute stuff',
  subscribers: 123,
  value: 'r/aww'
}

const preloadedState = {
  ...mockPreloadedState,
  settings: {
    ...mockPreloadedState.settings,
    favorites: [subreddit],
    recent: []
  }
}

describe('useSidebarSection', () => {
  it('isFavorite returns true if in favorites', () => {
    const {result} = renderHook(() => useSidebarSection(), {preloadedState})
    expect(result.current.isFavorite(subreddit)).toBe(true)
    expect(result.current.isFavorite(subreddit2)).toBe(false)
  })

  it('handleDelete calls onDelete if provided', () => {
    const onDelete = vi.fn()
    const {result} = renderHook(() => useSidebarSection(onDelete), {
      preloadedState
    })
    act(() => {
      result.current.handleDelete(subreddit)
    })
    expect(onDelete).toHaveBeenCalledWith(subreddit)
  })

  it('handleDelete does nothing if onDelete not provided', () => {
    const {result} = renderHook(() => useSidebarSection(), {preloadedState})
    act(() => {
      result.current.handleDelete(subreddit)
    })
  })

  it('handleToggleFavorite adds to favorites if not already favorite', () => {
    const {result, store} = renderHook(() => useSidebarSection(), {
      preloadedState
    })
    act(() => {
      result.current.handleToggleFavorite(subreddit2, false)
    })
    const state = store.getState()
    expect(state.settings.favorites.some((s) => s.display_name === 'aww')).toBe(
      true
    )
  })

  it('handleToggleFavorite removes from favorites if already favorite', () => {
    const {result, store} = renderHook(() => useSidebarSection(), {
      preloadedState
    })
    act(() => {
      result.current.handleToggleFavorite(subreddit, true)
    })
    const state = store.getState()
    expect(
      state.settings.favorites.some((s) => s.display_name === 'reactjs')
    ).toBe(false)
  })
})
