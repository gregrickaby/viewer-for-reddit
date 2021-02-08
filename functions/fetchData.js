/**
 * Fetch data from Reddit.
 *
 * @param {string} subreddit The name of the subreddit.
 * @param {string} lastPost  The last post in the list.
 * @return {object}          Reddit posts.
 */
export async function fetchData(subreddit, lastPost) {
  // Create query string for after.
  const after = lastPost ? `&after=${lastPost}` : ''

  // Attempt to fetch posts.
  const response = await fetch(
    `https://oauth.reddit.com/r/${subreddit}/hot/.json?limit=10${after}`,
    {
      headers: {
        Authorization: `bearer ${process.env.NEXT_PUBLIC_REDDIT_ACCESS_TOKEN}`,
        'user-agent': 'reddit-image-viewer'
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

  // Filter out any "self" (aka text) posts.
  const postsContainImage = json.data.children.filter((post) => {
    return post.data.post_hint && post.data.post_hint !== 'self'
  })

  // Finally, return posts.
  return {
    posts: postsContainImage.map((post) => post?.data),
    after: json?.data?.after
  }
}
