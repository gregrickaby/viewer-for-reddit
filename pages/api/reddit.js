/**
 * Query Reddit API.
 *
 * @see https://nextjs.org/docs/api-routes/introduction
 */
export default async function reddit(req, res) {
  // Parse the request.
  const after = req.query.after ? req.query.after : ''
  const sort = req.query.sort ? req.query.sort : 'hot'
  const sub = req.query.sub ? req.query.sub : 'itookapicture'
  const limit = req.query.limit ? req.query.limit : '24'

  // Format the shape of the post data.
  function postShape(post) {
    return {
      title: post.title,
      upvotes: post.ups,
      nswf: post.over_18,
      type: post.post_hint,
      posted_on: post.created_utc,
      comments: post.num_comments,
      subreddit: `https://www.reddit.com/${post.subreddit_name_prefixed}`,
      permalink: `https://www.reddit.com${post.permalink}`,
      thumbnail: post.thumbnail,
      url: post.url,
      images: post.preview.images,
      media: post.media,
      secure_media: post.secure_media
    }
  }

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
      posts: postsContainImage.map((post) => postShape(post?.data)),
      after: json?.data?.after
    })
  } catch (error) {
    // Issue? Leave a message and bail.
    res.status(500).json({message: `${error}`})
  }
}
