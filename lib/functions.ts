import config from '@/lib/config'
import {FetchPostsProps, ImageAsset, TokenProps} from '@/lib/types'

/**
 * Global fetcher function for useSWR.
 */
export async function fetcher(url: RequestInfo, init?: RequestInit) {
  const response = await fetch(url, init)

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Generate Reddit oAuth Token for application.
 *
 * @see https://github.com/reddit-archive/reddit/wiki/OAuth2#application-only-oauth
 */
export async function fetchToken(): Promise<TokenProps> {
  try {
    // Try and fetch a new access token.
    const tokenResponse = await fetch(
      `https://www.reddit.com/api/v1/access_token?grant_type=client_credentials&device_id=DO_NOT_TRACK_THIS_DEVICE`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': config.userAgent,
          'Cache-Control': 'no-cache',
          Authorization: `Basic ${btoa(
            `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
          )}`
        },
        next: {
          tags: ['token'],
          revalidate: 86400 // Reddit access tokens expire after 24 hours.
        }
      }
    )

    // Bad response? Bail...
    if (tokenResponse.status != 200) {
      return {
        error: `${tokenResponse.statusText}`
      }
    }

    // Get the access token.
    const token = await tokenResponse.json()

    // Issue with token? Bail...
    if (token.error) {
      return {
        error: token.error
      }
    }

    // Return token.
    return {
      token: token.access_token,
      type: token.token_type,
      expires: token.expires_in,
      scope: token.scope
    }
  } catch (error) {
    // Issue? Leave a message and bail.
    console.error(error)
    return {
      error: `${error}`
    }
  }
}

/**
 * Fetches posts from internal Reddit API.
 */
export async function fetchPosts({
  limit,
  lastPost,
  sort,
  subReddit
}: FetchPostsProps) {
  const after = lastPost ? lastPost : ''
  const number = limit ? limit : config.redditApi.limit
  const sortBy = sort ? sort : config.redditApi.sort
  const sub = subReddit ? subReddit : config.redditApi.subReddit

  try {
    // Try and fetch posts.
    const response = await fetch(
      `/api/reddit?sub=${sub}&sort=${sortBy}&limit=${number}&after=${after}`
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

/**
 * Try to find a medium sized image.
 */
export function getMediumImage(images: ImageAsset[]): ImageAsset | null {
  // If there are no images, return null.
  if (!Array.isArray(images) || images.length === 0) {
    return null
  }

  // Try to find an image with 640px resolution.
  const mediumSize = images.find((res) => res.width === 640)

  // Return the medium sized image; otherwise, return the highest resolution.
  return mediumSize || images[images.length - 1]
}
