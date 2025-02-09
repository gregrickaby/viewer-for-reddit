export default async function handler(req, res) {
  try {
    // Retrieve the OAuth token from the Authorization header.
    const authHeader = req.headers['authorization']
    if (!authHeader || typeof authHeader !== 'string') {
      return res.status(401).json({ error: 'Unauthorized: missing token' })
    }
    // Remove the "Bearer " prefix if present.
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: missing token' })
    }

    // Parse the query parameters.
    // Since req.url might be relative, we provide a base using the host header.
    const baseUrl = `http://${req.headers.host}`
    const urlObj = new URL(req.url || '', baseUrl)
    const after = urlObj.searchParams.get('after')

    // Build the target URL for Reddit’s popular posts.
    // This will call: https://oauth.reddit.com/r/popular.json?raw_json=1[&after=...]
    const targetUrl = new URL(
      'https://oauth.reddit.com/subreddits/popular.json'
    )
    targetUrl.searchParams.append('raw_json', '1')
    if (after) {
      targetUrl.searchParams.append('after', after)
    }
    // Optionally, you can add more query parameters (like limit) if needed.
    // e.g. targetUrl.searchParams.append('limit', '25');

    // Make the request to Reddit’s API using the token.
    const redditResponse = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        // Set the custom User-Agent header on the server side.
        'User-Agent': 'web-app:viewer-for-reddit:v1.0.0 (by /u/yourusername)'
      }
    })

    // If Reddit returns an error, forward it.
    if (!redditResponse.ok) {
      const errorData = await redditResponse.json()
      return res.status(redditResponse.status).json(errorData)
    }

    // Return the JSON data from Reddit.
    const data = await redditResponse.json()
    return res.status(200).json(data)
  } catch (error) {
    console.error('Error in /api/popular/index.ts:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
