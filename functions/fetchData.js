/**
 * Fetch data from internal Reddit API route.
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

  try {
    const response = await fetch(
      `/api/reddit?sub=${sub}&sort=${sort}&limit=${number}&after=${after}`
    )
    return await response.json()
  } catch (error) {
    console.error(error)
  }
}
