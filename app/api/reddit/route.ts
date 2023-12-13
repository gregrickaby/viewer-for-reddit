import config from '@/lib/config'
import {getMediumImage} from '@/lib/functions'
import {Posts} from '@/lib/types'

interface RedditAPIResponse {
  kind: string
  data: {
    modhash: string
    dist: number
    children: RedditPost[]
    after: string
    before: string
  }
}

interface RedditPost {
  kind: string
  data: {
    [key: string]: any
  }
}

/**
 * Route segment config.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
 */
export const runtime = 'edge'

/**
 * Query Reddit API.
 *
 * @example
 * /api/reddit?sub=itookapicture&sort=hot&limit=24&after=t3_9x9j4d
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/route-handlers
 * @see https://nextjs.org/docs/pages/api-reference/edge
 */
export async function GET(request: Request) {
  // Get query params from request.
  const {searchParams} = new URL(request.url)

  // Parse params.
  const unsanitizedParams = {
    postLimit: searchParams.get('limit') || '',
    sortBy: searchParams.get('sort') || '',
    subReddit: searchParams.get('sub') || '',
    lastPost: searchParams.get('after') || ''
  }

  // Parse and sanitize query params from request.
  const postLimit = unsanitizedParams.postLimit
    ? encodeURIComponent(unsanitizedParams.postLimit)
    : config.redditApi.limit
  const sortBy = unsanitizedParams.sortBy
    ? encodeURIComponent(unsanitizedParams.sortBy)
    : config.redditApi.sort
  const subReddit = unsanitizedParams.subReddit
    ? encodeURIComponent(unsanitizedParams.subReddit)
    : config.redditApi.subReddit
  const lastPost = unsanitizedParams.lastPost
    ? encodeURIComponent(unsanitizedParams.lastPost)
    : ''

  try {
    // Generate random device ID.
    // @see https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
    const array = new Uint32Array(24)
    const deviceId = self.crypto.getRandomValues(array)

    // Try and fetch a new access token.
    const tokenResponse = await fetch(
      `https://www.reddit.com/api/v1/access_token?grant_type=client_credentials&device_id=${deviceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json charset=UTF-8',
          'User-Agent': config.userAgent,
          Authorization: `Basic ${btoa(
            `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
          )}`
        }
      }
    )

    // Bad response? Bail...
    if (tokenResponse.status != 200) {
      return new Response(
        JSON.stringify({
          error: `${tokenResponse.statusText}`
        }),
        {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText
        }
      )
    }

    // Get the access token.
    const token = await tokenResponse.json()

    // Issue with token? Bail...
    if (token.error) {
      return new Response(
        JSON.stringify({
          error: token.error
        }),
        {
          status: token.status,
          statusText: token.statusText
        }
      )
    }

    // Attempt to fetch posts.
    const response = await fetch(
      `https://oauth.reddit.com/r/${subReddit}/${sortBy}/.json?limit=${postLimit}&after=${lastPost}&raw_json=1`,
      {
        headers: {
          Authorization: `Bearer: ${token.access_token}`
        }
      }
    )

    // No response? Bail...
    if (response.status != 200) {
      return new Response(
        JSON.stringify({
          error: `${response.statusText}`
        }),
        {
          status: response.status,
          statusText: response.statusText
        }
      )
    }

    // Parse the response.
    const json = (await response.json()) as RedditAPIResponse

    // No data in the response? Bail...
    if (!json.data || !json.data.children.length) {
      return new Response(
        JSON.stringify({
          error: `No data returned from Reddit.`
        }),
        {
          status: 400,
          statusText: 'Bad Request'
        }
      )
    }

    // Filter out any self or stickied posts.
    const postsContainImage = json.data.children.filter((post) => {
      return (
        post.data.post_hint &&
        post.data.post_hint !== 'self' &&
        post.data.stickied !== true
      )
    })

    // Create response shape.
    const data = {
      posts: postsContainImage.map((post) => ({
        id: post.data.id,
        images: {
          original: post.data.preview.images[0].source,
          cropped: getMediumImage(post.data.preview.images[0].resolutions),
          obfuscated: getMediumImage(
            post.data.preview.images[0]?.variants?.obfuscated?.resolutions
          )
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

    // Send the response.
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=300, stale-while-revalidate'
      },
      status: 200,
      statusText: 'OK'
    })
  } catch (error) {
    // Issue? Leave a message and bail.
    console.error(error)
    return new Response(JSON.stringify({error: `${error}`}), {
      status: 500,
      statusText: 'Internal Server Error'
    })
  }
}
