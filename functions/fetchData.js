/**
 * Fetch data from Reddit.
 *
 * @param {string} subreddit The name of the subreddit.
 * @param {string} lastPost  The last post in the list.
 * @param {string} sortBy    How to sort the posts.
 * @return {object}          Reddit posts.
 */
export async function fetchData({subreddit, lastPost, sortBy}) {
  // Create query string for after.
  const after = lastPost ? `&after=${lastPost}` : ''
  const sort = sortBy ? sortBy : 'hot'

  // Attempt to fetch posts.
  const response = await fetch(
    `https://oauth.reddit.com/r/${subreddit}/${sort}/.json?limit=5${after}`,
    {
      headers: {
        Authorization: `Bearer: ${process.env.NEXT_PUBLIC_REDDIT_ACCESS_TOKEN}`
      }
    }
  )

  // No response? Bail...
  if (!response.ok) {
    return {
      posts: [],
      after: null
    }
  }

  // Convert response to JSON.
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

  // Finally, return posts.
  return {
    posts: postsContainImage.map((post) => post?.data),
    after: json?.data?.after
  }
}
