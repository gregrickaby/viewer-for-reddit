export default async function handler(req, res) {
  try {
    // Retrieve the OAuth token from the Authorization header.
    const authHeader = req.headers['authorization']
    if (!authHeader || typeof authHeader !== 'string') {
      return res.status(401).json({ error: 'Unauthorized: missing token' })
    }
    // Remove any "Bearer " prefix.
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: missing token' })
    }

    // Construct a full URL to parse query parameters.
    // Note: req.url might be relative, so we use the host header to form a full URL.
    const baseUrl = `http://${req.headers.host}`
    const urlObj = new URL(req.url || '', baseUrl)

    // Retrieve the required 'subreddit' parameter.
    const subreddit = urlObj.searchParams.get('subreddit')
    if (!subreddit) {
      return res
        .status(400)
        .json({ error: 'Missing required parameter: subreddit' })
    }
    // Use "hot" as the default sort if not provided.
    const sort = urlObj.searchParams.get('sort') || 'hot'
    // Optional pagination parameters.
    const after = urlObj.searchParams.get('after') || ''
    // Allow an optional limit parameter, defaulting to "2" if not provided.
    const limit = urlObj.searchParams.get('limit') || '2'

    // Build the target URL for Reddit's OAuth API.
    // Example: https://oauth.reddit.com/r/{subreddit}/{sort}.json?raw_json=1&limit=2[&after=...]
    const targetUrl = new URL(
      `https://oauth.reddit.com/r/${subreddit}/${sort}.json`
    )
    targetUrl.searchParams.append('raw_json', '1')
    targetUrl.searchParams.append('limit', limit)
    if (after) {
      targetUrl.searchParams.append('after', after)
    }

    // Make the GET request to Reddit's OAuth API.
    const redditResponse = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'web-app:viewer-for-reddit:v1.0.0 (by /u/yourusername)'
      }
    })

    // If Reddit returns an error, forward that error.
    if (!redditResponse.ok) {
      const errorData = await redditResponse.json()
      return res.status(redditResponse.status).json(errorData)
    }

    // Parse and return the JSON data from Reddit.
    const data = await redditResponse.json()
    return res.status(200).json(data)
  } catch (error) {
    console.error('Error in /api/subreddit/index.ts:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
