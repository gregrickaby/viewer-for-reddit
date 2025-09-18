import type {RootState} from '@/lib/store'
import {createSlice} from '@reduxjs/toolkit'

export interface TransientState {
  toggleNavbar: boolean
  toggleSearch: boolean
  searchQuery: string
}

const initialState: TransientState = {
  toggleNavbar: false,
  toggleSearch: false,
  searchQuery: ''
}

/**
 * The transientSlice manages UI-related states.
 */
export const transientSlice = createSlice({
  name: 'transient',
  initialState,
  reducers: {
    /**
     * Toggle the navbar.
     */
    toggleNavbar: (state) => {
      state.toggleNavbar = !state.toggleNavbar
    },
    /**
     * Toggle the search.
     */
    toggleSearch: (state) => {
      state.toggleSearch = !state.toggleSearch
    },
    /**
     * Set the global search query.
     */
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload
    }
  }
})

// Export actions.
export const {toggleNavbar, toggleSearch, setSearchQuery} =
  transientSlice.actions

// Export selectors.
export const selectNavbar = (state: RootState) => state.transient.toggleNavbar
export const selectSearch = (state: RootState) => state.transient.toggleSearch
export const selectSearchQuery = (state: RootState) =>
  state.transient.searchQuery

// Export reducer.
export default transientSlice.reducer
