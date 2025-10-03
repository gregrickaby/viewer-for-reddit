import {
  authSlice,
  clearAuth,
  selectExpiresAt,
  selectIsAuthenticated,
  selectUsername,
  setAuth,
  type AuthState
} from './authSlice'

const authReducer = authSlice.reducer

const initialState: AuthState = {
  isAuthenticated: false,
  username: null,
  expiresAt: null
}

const authenticatedState: AuthState = {
  isAuthenticated: true,
  username: 'testuser',
  expiresAt: Date.now() + 3600000
}

describe('authSlice', () => {
  it('should return initial state', () => {
    expect(authReducer(undefined, {type: undefined as any})).toEqual(
      initialState
    )
  })

  describe('setAuth', () => {
    it('should set authentication state', () => {
      const payload = {
        username: 'testuser',
        expiresAt: Date.now() + 3600000
      }

      const state = authReducer(initialState, setAuth(payload))

      expect(state.isAuthenticated).toBe(true)
      expect(state.username).toBe(payload.username)
      expect(state.expiresAt).toBe(payload.expiresAt)
    })

    it('should update existing authentication state', () => {
      const newPayload = {
        username: 'newuser',
        expiresAt: Date.now() + 7200000
      }

      const state = authReducer(authenticatedState, setAuth(newPayload))

      expect(state.username).toBe(newPayload.username)
      expect(state.expiresAt).toBe(newPayload.expiresAt)
    })
  })

  describe('clearAuth', () => {
    it('should clear authentication state', () => {
      const state = authReducer(authenticatedState, clearAuth())

      expect(state.isAuthenticated).toBe(false)
      expect(state.username).toBeNull()
      expect(state.expiresAt).toBeNull()
    })

    it('should handle clearing already empty state', () => {
      const state = authReducer(initialState, clearAuth())

      expect(state).toEqual(initialState)
    })
  })

  describe('selectors', () => {
    it('selectIsAuthenticated should return authentication status', () => {
      expect(selectIsAuthenticated({auth: initialState})).toBe(false)
      expect(selectIsAuthenticated({auth: authenticatedState})).toBe(true)
    })

    it('selectUsername should return username', () => {
      expect(selectUsername({auth: initialState})).toBeNull()
      expect(selectUsername({auth: authenticatedState})).toBe('testuser')
    })

    it('selectExpiresAt should return expiration timestamp', () => {
      expect(selectExpiresAt({auth: initialState})).toBeNull()
      expect(selectExpiresAt({auth: authenticatedState})).toBe(
        authenticatedState.expiresAt
      )
    })
  })
})
