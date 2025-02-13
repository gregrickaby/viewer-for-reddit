import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RedditSubreddit } from '../../types/reddit'
import type { SortingOption, UserSettings } from '../../types/settings'
import {
  clearSettings,
  getInitialSettings,
  loadSettings,
  saveSettings
} from '../../utils/storage'
import { setDarkMode } from '../../utils/theme'

/**
 * Load initial settings from localStorage.
 */
const initialState: UserSettings = {
  ...loadSettings()
}

// Set dark mode based on initial state.
setDarkMode(initialState.darkMode)

/**
 * Settings Slice.
 */
export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // Toggle dark/light theme and persist to localStorage.
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode
      setDarkMode(state.darkMode)
      saveSettings(state)
    },

    // Update sort method for posts.
    setSortingOption: (state, action: PayloadAction<SortingOption>) => {
      state.currentSort = action.payload
      saveSettings(state)
    },

    // Toggle NSFW content visibility.
    toggleNsfw: (state) => {
      state.enableNsfw = !state.enableNsfw
      saveSettings(state)
    },

    // Add subreddit to recent history (max 10).
    addRecentSubreddit: (state, action: PayloadAction<RedditSubreddit>) => {
      const exists = state.recent.findIndex(
        (sub) => sub.display_name === action.payload.display_name
      )
      if (exists !== -1) {
        state.recent.splice(exists, 1)
      }
      state.recent.unshift(action.payload)
      state.recent = state.recent.slice(0, 10) // Keep only 10 recent.
      saveSettings(state)
    },

    // Clear recent subreddits.
    clearRecent: (state) => {
      state.recent = []
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

    // Toggle global mute state.
    toggleMute: (state) => {
      state.isMuted = !state.isMuted
      saveSettings(state)
    },

    // Toggle recent subreddits modal.
    toggleRecent: (state) => {
      state.showRecent = !state.showRecent
      state.showSettings = false
      state.showSearch = false
      state.showAbout = false
      saveSettings(state)
    },

    // Toggle settings modal visibility.
    toggleSettings: (state) => {
      state.showSettings = !state.showSettings
      state.showRecent = false
      state.showSearch = false
      saveSettings(state)
    },

    // Close all modals.
    closeAllModals: (state) => {
      state.showRecent = false
      state.showSettings = false
      state.showSearch = false
      state.showAbout = false
      saveSettings(state)
    },

    // Toggle search modal visibility.
    toggleSearch: (state) => {
      state.showSearch = !state.showSearch
      state.showRecent = false
      state.showSettings = false
      saveSettings(state)
    },

    // Toggle about modal visibility.
    toggleAbout: (state) => {
      state.showAbout = !state.showAbout
      state.showSettings = false
      state.showRecent = false
      saveSettings(state)
    },

    // Toggle app loading state.
    toggleAppLoading: (state) => {
      state.isAppLoading = !state.isAppLoading
      saveSettings(state)
    }
  }
})

// Export actions.
export const {
  addRecentSubreddit,
  clearRecent,
  closeAllModals,
  resetSettings,
  setCurrentSubreddit,
  setSortingOption,
  toggleAbout,
  toggleAppLoading,
  toggleDarkMode,
  toggleMute,
  toggleNsfw,
  toggleRecent,
  toggleSearch,
  toggleSettings
} = settingsSlice.actions

// Export reducer.
export default settingsSlice.reducer
