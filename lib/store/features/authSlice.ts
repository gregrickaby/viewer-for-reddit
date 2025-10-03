import {createSlice, type PayloadAction} from '@reduxjs/toolkit'

/**
 * Authentication state interface (client-safe, no tokens).
 * Tokens are stored server-side only in encrypted session cookies.
 */
export interface AuthState {
  isAuthenticated: boolean
  username: string | null
  expiresAt: number | null
}

/**
 * Initial authentication state.
 */
const initialState: AuthState = {
  isAuthenticated: false,
  username: null,
  expiresAt: null
}

/**
 * Authentication slice for managing user auth state in Redux.
 *
 * This slice syncs with session data but NEVER stores tokens client-side.
 * All tokens remain server-only in encrypted cookies.
 */
export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Set authentication state from session data (no tokens).
     */
    setAuth: (
      state,
      action: PayloadAction<{
        username: string
        expiresAt: number
      }>
    ) => {
      state.isAuthenticated = true
      state.username = action.payload.username
      state.expiresAt = action.payload.expiresAt
    },

    /**
     * Clear authentication state on logout.
     */
    clearAuth: (state) => {
      state.isAuthenticated = false
      state.username = null
      state.expiresAt = null
    }
  },
  selectors: {
    selectIsAuthenticated: (state) => state.isAuthenticated,
    selectUsername: (state) => state.username,
    selectExpiresAt: (state) => state.expiresAt
  }
})

// Export actions
export const {setAuth, clearAuth} = authSlice.actions

// Export selectors
export const {selectIsAuthenticated, selectUsername, selectExpiresAt} =
  authSlice.selectors
