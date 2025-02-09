import { fetchBaseQuery, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { BaseQueryApi, FetchArgs } from '@reduxjs/toolkit/query/react'
import { logout, setToken } from '../store/features/settingsSlice'
import type { RootState } from '../store/store'

/**
 * Standard baseQuery instance.
 * This base query points to your proxy endpoint for Reddit API calls.
 * (Your proxy will add the forbidden headers, like "User-Agent", on the server side.)
 */
const baseQuery = fetchBaseQuery({
  baseUrl: '/api/',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).settings.authToken
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  }
})

/**
 * Helper function to retrieve an OAuth token from your serverless route.
 * This function queries `/api/auth` which should return a JSON response
 * containing a token.
 */
async function fetchAuthToken(): Promise<string> {
  const response = await fetch('/api/auth', {
    method: 'GET',
    headers: {
      // Include the API key header that your route expects.
      'x-api-key': import.meta.env.VITE_API_KEY || ''
    }
  })
  if (!response.ok) {
    throw new Error('Failed to fetch auth token')
  }
  const data = await response.json()
  // Note: Your /api/auth endpoint returns the token inside "data", not "access_token"
  if (!data.data) {
    throw new Error(data.error || 'No access token in response')
  }
  return data.data
}

/**
 * Custom base query function that:
 * 1. Checks for an auth token in state; if missing, it queries `/api/auth` to get one.
 * 2. Performs the API request via the base query.
 * 3. If a 401 Unauthorized error is returned, it attempts to refresh the token and retries.
 */
export async function baseQueryWithAuth(
  args: string | FetchArgs,
  api: BaseQueryApi,
  extraOptions: object = {}
) {
  const state = api.getState() as RootState
  let token = state.settings.authToken

  // If the token is missing, try to retrieve it from our /api/auth route.
  if (!token) {
    try {
      token = await fetchAuthToken()
      api.dispatch(setToken(token))
    } catch (error) {
      console.error('Failed to fetch initial token:', error)
      return {
        error: { status: 'FETCH_ERROR', error: 'Failed to authenticate' }
      }
    }
  }

  // Attempt the original request.
  let result = await baseQuery(args, api, extraOptions)

  // If we receive a 401, attempt to refresh the token and retry.
  if (result.error && (result.error as FetchBaseQueryError).status === 401) {
    try {
      token = await fetchAuthToken()
      api.dispatch(setToken(token))
      result = await baseQuery(args, api, extraOptions)
    } catch (error) {
      console.error('Token refresh failed:', error)
      api.dispatch(logout())
    }
  }

  return result
}
