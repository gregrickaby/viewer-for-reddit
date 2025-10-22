import type {SortingOption, SubredditItem, UserSettings} from '@/lib/types'
import * as storage from '@/lib/utils/storage/storage'
import settingsReducer, {
  addRecentSubreddit,
  addToSearchHistory,
  clearFavorites,
  clearRecent,
  clearSearchHistory,
  clearSingleFavorite,
  clearSingleRecent,
  clearSingleSearchHistory,
  resetSettings,
  setCurrentSubreddit,
  setSortingOption,
  toggleFavoriteSubreddit,
  toggleMute,
  toggleNsfw
} from './settingsSlice'

const baseState: UserSettings = {
  currentSort: 'hot',
  currentSubreddit: '',
  enableNsfw: true,
  favorites: [],
  isMuted: true,
  recent: [],
  searchHistory: []
}

const subreddit: SubredditItem = {
  display_name: 'test',
  icon_img: '',
  over18: false,
  public_description: '',
  subscribers: 1,
  value: 'test'
}

describe('settingsSlice', () => {
  let saveSpy: ReturnType<typeof vi.fn>
  let clearSpy: ReturnType<typeof vi.fn>
  let getInitialSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    saveSpy = vi.spyOn(storage, 'saveSettings').mockImplementation(() => {})
    clearSpy = vi.spyOn(storage, 'clearSettings').mockImplementation(() => {})
    getInitialSpy = vi
      .spyOn(storage, 'getInitialSettings')
      .mockReturnValue(baseState)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return initial state', () => {
    expect(settingsReducer(undefined, {type: undefined as any})).toEqual(
      baseState
    )
  })

  it('toggleMute toggles isMuted', () => {
    const state = {...baseState, isMuted: false}
    const next = settingsReducer(state, toggleMute())
    expect(next.isMuted).toBe(true)
    expect(saveSpy).toHaveBeenCalled()
  })

  it('toggleNsfw toggles enableNsfw', () => {
    const state = {...baseState, enableNsfw: false}
    const next = settingsReducer(state, toggleNsfw())
    expect(next.enableNsfw).toBe(true)
    expect(saveSpy).toHaveBeenCalled()
  })

  it('setSortingOption sets currentSort', () => {
    const next = settingsReducer(
      baseState,
      setSortingOption('top' as SortingOption)
    )
    expect(next.currentSort).toBe('top')
    expect(saveSpy).toHaveBeenCalled()
  })

  it('addRecentSubreddit adds to recent, dedupes, max 15', () => {
    let state: UserSettings = {...baseState, recent: []}
    state = settingsReducer(state, addRecentSubreddit(subreddit))
    expect(state.recent[0]).toEqual(subreddit)
    state = settingsReducer(state, addRecentSubreddit(subreddit))
    expect(state.recent.length).toBe(1)
    for (let i = 0; i < 16; i++) {
      const sub: SubredditItem = {
        ...subreddit,
        display_name: `sub${i}`,
        value: `sub${i}`
      }
      state = settingsReducer(state, addRecentSubreddit(sub))
    }
    expect(state.recent.length).toBe(15)
    expect(saveSpy).toHaveBeenCalled()
  })

  it('clearSingleRecent removes a subreddit from recent', () => {
    let state = {...baseState, recent: [subreddit]}
    state = settingsReducer(state, clearSingleRecent('test'))
    expect(state.recent.length).toBe(0)
    expect(saveSpy).toHaveBeenCalled()
  })

  it('clearRecent empties recent', () => {
    let state = {...baseState, recent: [subreddit]}
    state = settingsReducer(state, clearRecent())
    expect(state.recent).toEqual([])
    expect(saveSpy).toHaveBeenCalled()
  })

  it('toggleFavoriteSubreddit toggles in favorites, max 15', () => {
    let state: UserSettings = {...baseState, favorites: []}
    state = settingsReducer(state, toggleFavoriteSubreddit(subreddit))
    expect(state.favorites[0]).toEqual(subreddit)
    state = settingsReducer(state, toggleFavoriteSubreddit(subreddit))
    expect(state.favorites.length).toBe(0)
    for (let i = 0; i < 16; i++) {
      const fav: SubredditItem = {
        ...subreddit,
        display_name: `fav${i}`,
        value: `fav${i}`
      }
      state = settingsReducer(state, toggleFavoriteSubreddit(fav))
    }
    expect(state.favorites.length).toBe(15)
    expect(saveSpy).toHaveBeenCalled()
  })

  it('clearSingleFavorite removes a subreddit from favorites', () => {
    let state = {...baseState, favorites: [subreddit]}
    state = settingsReducer(state, clearSingleFavorite('test'))
    expect(state.favorites.length).toBe(0)
    expect(saveSpy).toHaveBeenCalled()
  })

  it('clearFavorites empties favorites', () => {
    let state = {...baseState, favorites: [subreddit]}
    state = settingsReducer(state, clearFavorites())
    expect(state.favorites).toEqual([])
    expect(saveSpy).toHaveBeenCalled()
  })

  it('resetSettings resets to initial', () => {
    const state = {...baseState, isMuted: false}
    const next = settingsReducer(state, resetSettings())
    expect(next).toEqual(baseState)
    expect(clearSpy).toHaveBeenCalled()
    expect(getInitialSpy).toHaveBeenCalled()
  })

  it('setCurrentSubreddit sets currentSubreddit', () => {
    const next = settingsReducer(baseState, setCurrentSubreddit('r/test'))
    expect(next.currentSubreddit).toBe('r/test')
    expect(saveSpy).toHaveBeenCalled()
  })

  it('addToSearchHistory adds to search history', () => {
    const state = {...baseState, searchHistory: []}
    const next = settingsReducer(state, addToSearchHistory(subreddit))
    expect(next.searchHistory[0]).toEqual(subreddit)
    expect(saveSpy).toHaveBeenCalled()
  })

  it('clearSearchHistory empties search history', () => {
    const state = {...baseState, searchHistory: [subreddit]}
    const next = settingsReducer(state, clearSearchHistory())
    expect(next.searchHistory).toEqual([])
    expect(saveSpy).toHaveBeenCalled()
  })

  it('clearSingleSearchHistory removes specific item from search history', () => {
    const subreddit2: SubredditItem = {
      display_name: 'test2',
      icon_img: '',
      over18: false,
      public_description: '',
      subscribers: 1,
      value: 'test2'
    }
    const state = {...baseState, searchHistory: [subreddit, subreddit2]}
    const next = settingsReducer(state, clearSingleSearchHistory('test'))
    expect(next.searchHistory).toEqual([subreddit2])
    expect(saveSpy).toHaveBeenCalled()
  })
})
