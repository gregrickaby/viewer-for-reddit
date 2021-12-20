/**
 * Query Reddit API .
 */
export default async function reddit(req, res) {
  // Parse the request.
  const after = req.query.after ? req.query.after : ''
  const sort = req.query.sort ? req.query.sort : 'hot'
  const sub = req.query.sub ? req.query.sub : 'pics'
  const limit = req.query.limit ? req.query.limit : '10'

  try {
    // Attempt to fetch posts.
    const response = await fetch(
      `https://oauth.reddit.com/r/${sub}/${sort}/.json?limit=${limit}&after=${after}`,
      {
        headers: {
          Authorization: `Bearer: ${process.env.REDDIT_ACCESS_TOKEN}`
        }
      }
    )
    const json = await response.json()

    // Send the response to the user.
    res.status(200).json(json)
  } catch (error) {
    // Issue? Leave a message and bail.
    res.status(500).json({message: `${error}`})
  }
}
