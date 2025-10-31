import type {
  CommentSortingOption,
  SortingOption,
  SubredditItem,
  UserSettings
} from '@/lib/types'
import {COMMENT_CONFIG} from '@/lib/config'
import {addToSearchHistory as addToSearchHistoryUtil} from '@/lib/utils/storage/searchHistory'
import {
  clearSettings,
  getInitialSettings,
  loadSettings,
  saveSettings
} from '@/lib/utils/storage/storage'
import {createSlice, PayloadAction} from '@reduxjs/toolkit'

/**
 * Load initial settings from localStorage.
 */
const initialState: UserSettings = {
  ...loadSettings()
}

/**
 * Settings Slice.
 */
export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    /**
     * Toggle global audio mute state for video/audio content.
     */
    toggleMute: (state) => {
      state.isMuted = !state.isMuted
      saveSettings(state)
    },

    /**
     * Toggle NSFW (Not Safe For Work) content visibility.
     */
    toggleNsfw: (state) => {
      state.enableNsfw = !state.enableNsfw
      saveSettings(state)
    },

    /**
     * Update the current sorting method for Reddit posts.
     * @param action.payload - The new sorting option (hot, new, top, controversial, rising)
     */
    setSortingOption: (state, action: PayloadAction<SortingOption>) => {
      state.currentSort = action.payload
      saveSettings(state)
    },

    /**
     * Update the current sorting method for Reddit comments.
     * @param action.payload - The new comment sorting option (best, top, new, controversial)
     */
    setCommentSortingOption: (
      state,
      action: PayloadAction<CommentSortingOption>
    ) => {
      state.commentSort = action.payload
      saveSettings(state)
    },

    // Add subreddit to recent history.
    addRecentSubreddit: (state, action: PayloadAction<SubredditItem>) => {
      const exists = state.recent.findIndex(
        (sub) => sub.display_name === action.payload.display_name
      )
      if (exists !== -1) {
        state.recent.splice(exists, 1)
      }
      state.recent.unshift(action.payload)
      state.recent = state.recent.slice(0, COMMENT_CONFIG.MAX_LIST_ITEMS)
      saveSettings(state)
    },

    clearSingleRecent: (state, action: PayloadAction<string>) => {
      const exists = state.recent.findIndex(
        (sub) => sub.display_name === action.payload
      )
      if (exists !== -1) {
        state.recent.splice(exists, 1)
      }
      saveSettings(state)
    },

    // Clear recent subreddits.
    clearRecent: (state) => {
      state.recent = []
      saveSettings(state)
    },

    // Toggle subreddit in favorites.
    toggleFavoriteSubreddit: (state, action: PayloadAction<SubredditItem>) => {
      const existingIndex = state.favorites.findIndex(
        (sub) => sub.display_name === action.payload.display_name
      )
      if (existingIndex === -1) {
        state.favorites.unshift(action.payload)
        state.favorites = state.favorites.slice(
          0,
          COMMENT_CONFIG.MAX_LIST_ITEMS
        )
      } else {
        state.favorites.splice(existingIndex, 1)
      }
      saveSettings(state)
    },

    // Clear a single favorite subreddit.
    clearSingleFavorite: (state, action: PayloadAction<string>) => {
      const existingIndex = state.favorites.findIndex(
        (sub) => sub.display_name === action.payload
      )
      if (existingIndex !== -1) {
        state.favorites.splice(existingIndex, 1)
      }
      saveSettings(state)
    },

    // Clear favorite subreddits.
    clearFavorites: (state) => {
      state.favorites = []
      saveSettings(state)
    },

    // Reset all settings to defaults.
    resetSettings: () => {
      clearSettings()
      return getInitialSettings()
    },

    // Set current subreddit for post fetching.
    setCurrentSubreddit: (state, action: PayloadAction<string>) => {
      state.currentSubreddit = action.payload
      saveSettings(state)
    },

    // Add subreddit to search history.
    addToSearchHistory: (state, action: PayloadAction<SubredditItem>) => {
      state.searchHistory = addToSearchHistoryUtil(
        state.searchHistory,
        action.payload
      )
      saveSettings(state)
    },

    // Clear a single search history item.
    clearSingleSearchHistory: (state, action: PayloadAction<string>) => {
      const existingIndex = state.searchHistory.findIndex(
        (sub) => sub.value === action.payload
      )
      if (existingIndex !== -1) {
        state.searchHistory.splice(existingIndex, 1)
      }
      saveSettings(state)
    },

    // Clear search history.
    clearSearchHistory: (state) => {
      state.searchHistory = []
      saveSettings(state)
    }
  }
})

// Export actions.
export const {
  addRecentSubreddit,
  addToSearchHistory,
  clearFavorites,
  clearRecent,
  clearSearchHistory,
  clearSingleFavorite,
  clearSingleRecent,
  clearSingleSearchHistory,
  resetSettings,
  setCommentSortingOption,
  setCurrentSubreddit,
  setSortingOption,
  toggleFavoriteSubreddit,
  toggleMute,
  toggleNsfw
} = settingsSlice.actions

// Export reducer.
export default settingsSlice.reducer
