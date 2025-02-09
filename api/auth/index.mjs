/**
 * Validate the required environment variables are set.
 */
function validateEnvVars() {
  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET
  const apiKey = process.env.VITE_API_KEY

  if (!clientId || !clientSecret || !apiKey) {
    throw new Error('Missing environment variables!')
  }

  return { clientId, clientSecret, apiKey }
}

/**
 * Fetch a Reddit OAuth token.
 *
 * This function is called by the `/api/auth` route and is protected by an x-api-key.
 */
export default async function handler(req, res) {
  try {
    // Set default response headers.
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('X-Robots-Tag', 'noindex')

    // Get the required environment variables.
    const { clientId, clientSecret, apiKey } = validateEnvVars()

    // Get the x-api-key header from the request.
    const key = Array.isArray(req.headers['x-api-key'])
      ? req.headers['x-api-key'][0]
      : req.headers['x-api-key']

    // Check the x-api-key. If it doesn't match, return a 401 Unauthorized.
    if (key !== apiKey) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Create a new URL object for the Reddit API endpoint.
    const url = new URL('https://www.reddit.com/api/v1/access_token')

    // Build form data for the POST body.
    const formBody = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'read',
      device_id: 'DO_NOT_TRACK_THIS_DEVICE'
    }).toString()

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'web-app:viewer-for-reddit:* (by Greg Rickaby)',
        Authorization: `Basic ${Buffer.from(
          `${clientId}:${clientSecret}`
        ).toString('base64')}`
      },
      body: formBody
    })

    // If the response is not OK, throw an error.
    if (!response.ok) {
      throw new Error(
        `Failed to fetch Reddit oAuth Token. Status: ${response.status} ${response.statusText}`
      )
    }

    // Parse the response JSON.
    const data = await response.json()

    // If the response does not contain an access_token, throw an error.
    if (!data.access_token) {
      throw new Error(data.error || 'No access token in response')
    }

    // Return the access_token.
    return res.status(200).json({ data: data.access_token })
  } catch (error) {
    console.error(`Exception thrown while fetching auth token: ${error}`)
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('X-Robots-Tag', 'noindex')
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
