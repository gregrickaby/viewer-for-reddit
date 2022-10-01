interface FetchPostsProps {
  lastPost?: string
  limit?: number
  sortBy?: string
  subreddit: string
}

/**
 * Fetches posts from internal Reddit API.
 */
export async function fetchPosts({
  limit,
  lastPost,
  sortBy,
  subreddit
}: FetchPostsProps) {
  const after = lastPost ? lastPost : ''
  const number = limit ? limit : '24'
  const sort = sortBy ? sortBy : 'hot'
  const sub = subreddit ? subreddit : 'itookapicture'

  try {
    // Try and fetch posts.
    const response = await fetch(
      `/api/reddit?sub=${sub}&sort=${sort}&limit=${number}&after=${after}`,
      {
        cache: 'default'
      }
    )

    // Bad response? Bail...
    if (response.status != 200) {
      return {
        error: `${response.statusText}`
      }
    }

    // Return posts.
    return await response.json()
  } catch (error) {
    // Issue? Leave a message and bail.
    console.error(error)
    return {
      error: `${error}`
    }
  }
}

interface CleanIframeProps {
  html: string
}

/**
 * Replace the src attribute with a less terrible version.
 */
export function cleanIframe({html}: CleanIframeProps) {
  // Grab the src URL.
  const source = html.match(/(src="([^"]+)")/gi)

  return `<iframe
      ${source}
      allow="autoplay fullscreen"
      class="w-full aspect-video"
      loading="lazy"
      referrerpolicy="no-referrer"
      sandbox="allow-scripts allow-same-origin allow-presentation"
      title="iframe"
    />`
}
