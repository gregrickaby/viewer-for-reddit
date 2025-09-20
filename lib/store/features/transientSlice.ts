import type {RootState} from '@/lib/store'
import {createSlice} from '@reduxjs/toolkit'

/**
 * Mobile search state machine states
 * Provides clear state transitions and prevents invalid states
 */
export type MobileSearchState = 'closed' | 'opening' | 'open' | 'closing'

export interface TransientState {
  toggleNavbar: boolean
  mobileSearchState: MobileSearchState
  searchQuery: string
}

const initialState: TransientState = {
  toggleNavbar: false,
  mobileSearchState: 'closed',
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
     * Set the mobile search state.
     */
    setMobileSearchState: (state, action: {payload: MobileSearchState}) => {
      state.mobileSearchState = action.payload
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
export const {toggleNavbar, setMobileSearchState, setSearchQuery} =
  transientSlice.actions

// Export selectors.
export const selectNavbar = (state: RootState) => state.transient.toggleNavbar
export const selectMobileSearchState = (state: RootState) =>
  state.transient.mobileSearchState
export const selectSearchQuery = (state: RootState) =>
  state.transient.searchQuery

// Export reducer.
export default transientSlice.reducer
