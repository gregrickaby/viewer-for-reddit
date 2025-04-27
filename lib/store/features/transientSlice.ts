import type {RootState} from '@/lib/store'
import {createSlice} from '@reduxjs/toolkit'

export interface TransientState {
  toggleNavbar: boolean
  toggleSearch: boolean
}

const initialState: TransientState = {
  toggleNavbar: false,
  toggleSearch: false
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
    }
  }
})

// Export actions.
export const {toggleNavbar, toggleSearch} = transientSlice.actions

// Export selectors.
export const selectNavbar = (state: RootState) => state.transient.toggleNavbar
export const selectSearch = (state: RootState) => state.transient.toggleSearch

// Export reducer.
export default transientSlice.reducer
