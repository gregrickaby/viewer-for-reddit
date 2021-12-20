/**
 * Fetch data from Reddit.
 *
 * @param {number} limit    How many posts to fetch.
 * @param {string} lastPost  The last post in the list.
 * @param {string} sortBy    How to sort the posts.
 * @param {string} subreddit The name of the subreddit.
 * @return {object}          Reddit posts.
 */
export async function fetchData({limit, lastPost, sortBy, subreddit}) {
  const after = lastPost ? lastPost : ''
  const number = limit ? limit : '10'
  const sort = sortBy ? sortBy : 'hot'
  const sub = subreddit ? subreddit : 'pics'

  // Attempt to fetch posts.
  const response = await fetch(
    `/api/reddit?sub=${sub}&sort=${sort}&limit=${number}&after=${after}`
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
