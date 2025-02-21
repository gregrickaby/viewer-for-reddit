import { Buffer } from 'buffer'
import { console } from 'console'
import fetch from 'node-fetch'
import { URLSearchParams, URL } from 'url'
import process from 'process'

/**
 * Reddit API Configuration.
 *
 * @typedef {Object} Config
 * @property {number} TOKEN_BUFFER_TIME - Buffer time before token expiration (ms)
 * @property {number} REQUEST_LIMIT - Maximum requests per token
 * @property {string} USER_AGENT - User agent string for Reddit API
 * @property {string} REDDIT_TOKEN_URL - Reddit OAuth token endpoint
 * @property {string} REDDIT_SEARCH_URL - Reddit search API endpoint
 */

const CONFIG = {
  TOKEN_BUFFER_TIME: 60000, // 1 minute in ms.
  REQUEST_LIMIT: 999, // Reddit allows 1,000 requests per hour per token.
  USER_AGENT: 'web-app:viewer-for-reddit:v6.0.0 (by Greg Rickaby)',
  REDDIT_TOKEN_URL: 'https://www.reddit.com/api/v1/access_token',
  REDDIT_SEARCH_URL: 'https://oauth.reddit.com/api/subreddit_autocomplete_v2'
}

/**
 * Token cache for Reddit API.
 * Stores the current token, its expiration time, and request count.
 *
 * @type {{ token: string | null, expiresAt: number, requestCount: number }}
 */
let tokenCache = {
  token: null,
  expiresAt: 0,
  requestCount: 0
}

/**
 * Checks if the cached token is still valid.
 *
 * A token is considered valid if:
 * 1. It exists
 * 2. It's not expired (with buffer time)
 * 3. Request count hasn't exceeded limit
 *
 * @returns {boolean} True if token is valid, false otherwise
 */
function isTokenValid() {
  return (
    tokenCache.token &&
    Date.now() < tokenCache.expiresAt - CONFIG.TOKEN_BUFFER_TIME &&
    tokenCache.requestCount < CONFIG.REQUEST_LIMIT
  )
}

/**
 * Fetches a new access token from Reddit.
 *
 * @param {string} clientId - Reddit API client ID
 * @param {string} clientSecret - Reddit API client secret
 * @returns {Promise<{ access_token: string, expires_in: number }>} Token response
 * @throws {Error} If token fetch fails
 */
async function getRedditToken(clientId, clientSecret) {
  const response = await fetch(CONFIG.REDDIT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': CONFIG.USER_AGENT,
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'read'
    })
  })

  const data = await response.json()
  if (!data.access_token) throw new Error('Failed to get Reddit token')

  return data
}

/**
 * Search API request handler.
 * Handles subreddit search requests by:
 * 1. Validating API key
 * 2. Managing Reddit OAuth token
 * 3. Proxying search requests to Reddit
 * 4. Transforming and returning results
 *
 * @param {import('next').NextApiRequest} req - Incoming request
 * @param {import('next').NextApiResponse} res - Server response
 * @returns {Promise<void>}
 */
export default async function handler(req, res) {
  try {
    // Validate environment and API key.
    const { REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, VITE_API_KEY } = process.env
    if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET || !VITE_API_KEY) {
      throw new Error('Missing environment variables')
    }

    // API key validation.
    if (req.headers['x-api-key'] !== VITE_API_KEY) {
      return res.status(401).json({ error: 'Invalid API key' })
    }

    // Token management: Get existing or fetch new token.
    let access_token = isTokenValid() ? tokenCache.token : null
    if (!access_token) {
      const data = await getRedditToken(REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET)
      tokenCache = {
        token: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1000,
        requestCount: 0
      }
      access_token = data.access_token
    }

    // Parse and validate search query parameters.
    const params = new URL(req.url, `http://${req.headers.host}`).searchParams
    const query = params.get('query')?.trim()
    if (!query) {
      return res.status(400).json({ error: 'Missing or empty query' })
    }

    // Track API usage.
    tokenCache.requestCount++

    // Construct search parameters for Reddit API.
    const searchParams = new URLSearchParams({
      query,
      include_over_18: params.get('include_over_18') || 'false',
      include_profiles: params.get('include_profiles') || 'false',
      limit: params.get('limit') || '10',
      raw_json: '1',
      search_query_id: params.get('search_query_id') || 'DO_NOT_TRACK',
      typeahead_active: params.get('typeahead_active') || 'true'
    })

    // Make authenticated request to Reddit's search API.
    const searchResponse = await fetch(
      `${CONFIG.REDDIT_SEARCH_URL}?${searchParams}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'User-Agent': CONFIG.USER_AGENT
        }
      }
    )

    // Handle Reddit API errors.
    if (!searchResponse.ok) {
      throw new Error(`Reddit API error: ${searchResponse.status}`)
    }

    // Return successful response.
    const data = await searchResponse.json()
    return res.status(200).json(data)
  } catch (error) {
    // Detailed error logging in development.
    console.error('[Search API Error]:', error.message)
    return res.status(500).json({
      error: 'Internal Server Error',
      message:
        process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}
