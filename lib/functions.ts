import {GetPostsProps, Posts, RedditAPIResponse} from './types'

/**
 * Fetch an access token from the Reddit API.
 */
export async function getToken(): Promise<any> {
  try {
    // Try and fetch a new access token.
    const response = await fetch(
      `https://www.reddit.com/api/v1/access_token?grant_type=client_credentials&device_id=DO_NOT_TRACK_THIS_DEVICE`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json charset=UTF-8',
          'User-Agent': 'reddit-image-viewer/* by Greg Rickaby',
          Authorization: `Basic ${btoa(
            `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
          )}`
        },
        next: {
          revalidate: 3600
        }
      }
    )

    // Bad response? Bail...
    if (response.status != 200) {
      throw new Error(`${response.statusText}`)
    }

    // Get the access token.
    const token = await response.json()

    // Check for errors.
    if (token.error) {
      throw new Error(`${token.error}`)
    }

    // Return the token.
    return token
  } catch (error) {
    console.error(error)
  }
}

// Fetch posts from Reddit.
export async function getPosts({
  lastPost = '',
  limit = 24,
  sortBy = 'hot',
  subReddit = 'itookapicture'
}: GetPostsProps): Promise<any> {
  // Get an access token.
  const token = await getToken()

  try {
    // Try and fetch posts.
    const response = await fetch(
      `https://oauth.reddit.com/r/${subReddit}/${sortBy}/.json?limit=${limit}&after=${lastPost}&raw_json=1`,
      {
        headers: {
          Authorization: `Bearer: ${token.access_token}`
        },
        next: {
          revalidate: 3600
        }
      }
    )

    // Bad response? Bail...
    if (response.status != 200) {
      throw new Error(`${response.statusText}`)
    }

    // Parse the response.
    const json = (await response.json()) as RedditAPIResponse

    // Filter out any self or stickied posts.
    const postsContainImage = json.data.children.filter((post) => {
      return (
        post.data.post_hint &&
        post.data.post_hint !== 'self' &&
        post.data.stickied !== true
      )
    })

    // Create response shape.
    return {
      posts: postsContainImage.map((post) => ({
        id: post.data.id,
        images: {
          original: post.data.preview.images[0].source,
          cropped: post.data.preview.images[0].resolutions.pop(),
          obfuscated:
            post.data.preview.images[0]?.variants?.obfuscated?.resolutions?.pop()
        },
        media: post.data.media,
        video_preview: post.data.preview.reddit_video_preview,
        over_18: post.data.over_18,
        permalink: `https://www.reddit.com${post.data.permalink}`,
        post_hint: post.data.post_hint,
        score: post.data.score,
        secure_media_embed: post.data.secure_media_embed,
        subreddit: post.data.subreddit,
        thumbnail: post.data.thumbnail,
        title: post.data.title,
        url: post.data.url
      })),
      after: json?.data?.after
    } as Posts
  } catch (error) {
    console.error(error)
  }
}
