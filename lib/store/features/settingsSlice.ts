import type {SortingOption, SubredditItem, UserSettings} from '@/lib/types'
import {
  clearSettings,
  getInitialSettings,
  loadSettings,
  saveSettings
} from '@/lib/utils/storage'
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
    // Toggle global mute state.
    toggleMute: (state) => {
      state.isMuted = !state.isMuted
      saveSettings(state)
    },

    // Toggle NSFW content visibility.
    toggleNsfw: (state) => {
      state.enableNsfw = !state.enableNsfw
      saveSettings(state)
    },

    // Update sort method for posts.
    setSortingOption: (state, action: PayloadAction<SortingOption>) => {
      state.currentSort = action.payload
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
      state.recent = state.recent.slice(0, 15) // Keep only 15.
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
      if (existingIndex !== -1) {
        state.favorites.splice(existingIndex, 1)
      } else {
        state.favorites.unshift(action.payload)
        state.favorites = state.favorites.slice(0, 15) // Keep only 15
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
    }
  }
})

// Export actions.
export const {
  addRecentSubreddit,
  clearFavorites,
  clearRecent,
  clearSingleFavorite,
  clearSingleRecent,
  resetSettings,
  setCurrentSubreddit,
  setSortingOption,
  toggleFavoriteSubreddit,
  toggleMute,
  toggleNsfw
} = settingsSlice.actions

// Export reducer.
export default settingsSlice.reducer
