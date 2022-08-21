import type {NextApiRequest, NextApiResponse} from 'next'

/**
 * Query Reddit API for a sub-reddit.
 *
 * @see https://nextjs.org/docs/api-routes/introduction
 */
export default async function sub(req: NextApiRequest, res: NextApiResponse) {
  // Parse the request.
  const after = req.query.after ? req.query.after : ''
  const sort = req.query.sort ? req.query.sort : 'hot'
  const sub = req.query.sub ? req.query.sub : 'itookapicture'
  const limit = req.query.limit ? req.query.limit : '24'

  try {
    // Attempt to fetch posts.
    const response = await fetch(
      `https://oauth.reddit.com/r/${sub}/${sort}/.json?limit=${limit}&after=${after}&raw_json=1`,
      {
        headers: {
          Authorization: `Bearer: ${process.env.REDDIT_ACCESS_TOKEN}`
        }
      }
    )

    // No response? Bail...
    if (response.status != 200) {
      return {
        posts: [],
        after: null
      }
    }

    // Parse the response.
    const json = await response.json()

    // No data in the response? Bail...
    if (!json.data && !json.data.children) {
      return {
        posts: [],
        after: null
      }
    }

    // Filter out any self or stickied posts.
    const postsContainImage = json.data.children.filter((post) => {
      return (
        post.data.post_hint &&
        post.data.post_hint !== 'self' &&
        post.data.stickied !== true
      )
    })

    // Finally, send the data.
    res.status(200).json({
      posts: postsContainImage.map((post) => ({
        images: post.data.preview.images[0].resolutions.pop(),
        media: post.data.media,
        permalink: `https://www.reddit.com${post.data.permalink}`,
        secure_media: post.secure_media,
        subreddit: `https://www.reddit.com/${post.data.subreddit_name_prefixed}`,
        thumbnail: post.data.thumbnail,
        title: post.data.title,
        type: post.data.post_hint,
        ups: post.data.ups,
        url: post.data.url
      })),
      after: json?.data?.after,
      all: json?.data
    })
  } catch (error) {
    // Issue? Leave a message and bail.
    res.status(500).json({message: `${error}`})
  }
}
