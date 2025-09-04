import {
  getCachedToken,
  getRequestCount,
  incrementRequestCount,
  resetTokenState,
  setTokenState,
  shouldFetchNewToken
} from './token'

describe('token', () => {
  beforeEach(() => {
    resetTokenState()
  })

  it('shouldFetchNewToken returns true if no token', () => {
    expect(shouldFetchNewToken(null, 0)).toBe(true)
  })

  it('shouldFetchNewToken returns true if request count >= MAX_REQUESTS', () => {
    expect(shouldFetchNewToken({access_token: 'foo'} as any, 950)).toBe(true)
  })

  it('shouldFetchNewToken returns false if token exists and count < MAX_REQUESTS', () => {
    expect(shouldFetchNewToken({access_token: 'foo'} as any, 10)).toBe(false)
  })

  it('getRequestCount returns 0 after reset', () => {
    expect(getRequestCount()).toBe(0)
  })

  it('getCachedToken returns null after reset', () => {
    expect(getCachedToken()).toBeNull()
  })

  it('setTokenState sets token and count', () => {
    setTokenState({access_token: 'bar'} as any, 5)
    expect(getCachedToken()).toEqual({access_token: 'bar'})
    expect(getRequestCount()).toBe(5)
  })

  it('incrementRequestCount increments count', () => {
    setTokenState({access_token: 'bar'} as any, 5)
    incrementRequestCount()
    expect(getRequestCount()).toBe(6)
  })
})
