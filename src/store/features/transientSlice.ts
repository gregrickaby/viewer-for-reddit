import { createSlice } from '@reduxjs/toolkit'

interface TransientState {
  showRecent: boolean
  showFavorites: boolean
  showSettings: boolean
  showSearch: boolean
  showAbout: boolean
  isAppLoading: boolean
}

// Initial state.
const initialState: TransientState = {
  showRecent: false,
  showFavorites: false,
  showSettings: false,
  showSearch: false,
  showAbout: false,
  isAppLoading: true
}

/**
 * Transient Slice.
 */
export const transientSlice = createSlice({
  name: 'transient',
  initialState,
  reducers: {
    // Toggle recent modal.
    toggleRecent: (state) => {
      state.showRecent = !state.showRecent
      state.showSettings = false
      state.showSearch = false
      state.showAbout = false
      state.showFavorites = false
    },

    // Toggle favorites modal.
    toggleFavorites: (state) => {
      state.showFavorites = !state.showFavorites
      state.showSettings = false
      state.showSearch = false
      state.showAbout = false
      state.showRecent = false
    },

    // Toggle settings modal.
    toggleSettings: (state) => {
      state.showSettings = !state.showSettings
      state.showRecent = false
      state.showSearch = false
    },

    // Toggle search modal.
    toggleSearch: (state) => {
      state.showSearch = !state.showSearch
      state.showRecent = false
      state.showSettings = false
      state.showFavorites = false
    },

    // Toggle about modal.
    toggleAbout: (state) => {
      state.showAbout = !state.showAbout
      state.showSettings = false
      state.showRecent = false
      state.showSearch = false
    },

    // Toggle app loading state.
    toggleAppLoading: (state) => {
      state.isAppLoading = !state.isAppLoading
    },

    // Close all modals.
    closeAllModals: (state) => {
      state.showAbout = false
      state.showFavorites = false
      state.showRecent = false
      state.showSearch = false
      state.showSettings = false
    }
  }
})

// Export actions.
export const {
  closeAllModals,
  toggleAbout,
  toggleAppLoading,
  toggleFavorites,
  toggleRecent,
  toggleSearch,
  toggleSettings
} = transientSlice.actions

// Export reducer.
export default transientSlice.reducer
