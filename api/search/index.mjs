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

    // Parse the query parameters from the request URL.
    // Construct a full URL using a base if necessary.
    const baseUrl = `http://${req.headers.host}`
    const urlObj = new URL(req.url || '', baseUrl)

    // Retrieve required 'query' parameter.
    const query = urlObj.searchParams.get('query')
    if (!query) {
      return res.status(400).json({ error: 'Missing search query parameter' })
    }

    // Extract additional optional parameters.
    const include_over_18 =
      urlObj.searchParams.get('include_over_18') || 'false'
    const include_profiles =
      urlObj.searchParams.get('include_profiles') || 'false'
    const typeahead_active =
      urlObj.searchParams.get('typeahead_active') || 'false'
    const search_query_id =
      urlObj.searchParams.get('search_query_id') || 'DO_NOT_TRACK'

    // Build the target URL for Reddit's autocomplete v2 endpoint.
    const targetUrl = new URL(
      'https://oauth.reddit.com/api/subreddit_autocomplete_v2'
    )
    targetUrl.searchParams.append('query', query)
    targetUrl.searchParams.append('include_over_18', include_over_18)
    targetUrl.searchParams.append('include_profiles', include_profiles)
    targetUrl.searchParams.append('typeahead_active', typeahead_active)
    targetUrl.searchParams.append('search_query_id', search_query_id)
    targetUrl.searchParams.append('raw_json', '1')

    // Make the GET request to Reddit's API using the token.
    const redditResponse = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'web-app:viewer-for-reddit:v1.0.0 (by /u/yourusername)'
      }
    })

    // If Reddit returns an error, forward it.
    if (!redditResponse.ok) {
      const errorData = await redditResponse.json()
      return res.status(redditResponse.status).json(errorData)
    }

    // Parse and return the successful JSON response.
    const data = await redditResponse.json()
    return res.status(200).json(data)
  } catch (error) {
    console.error('Error in /api/search/index.ts:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
