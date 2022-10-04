import type {NextRequest} from 'next/server'
import {Posts} from '~/lib/types'

export const config = {
  runtime: 'experimental-edge'
}

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
 * Query Reddit API.
 *
 * @example
 * /api/reddit?sub=itookapicture&sort=hot&limit=24&after=t3_9x9j4d
 *
 * @see https://nextjs.org/docs/api-routes/edge-api-routes
 * @see https://nextjs.org/docs/api-reference/edge-runtime
 */
export default async function reddit(req: NextRequest) {
  // Get query params from request.
  const params = new URL(req.url).searchParams

  // Parse and sanitize query params.
  const after = encodeURI(params.get('after')) || ''
  const sort = encodeURI(params.get('sort')) || 'hot'
  const sub = encodeURI(params.get('sub')) || 'itookapicture'
  const limit = parseInt(params.get('limit')) || 24

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
    if (!json.data && !json.data.children.length) {
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
        images: post.data.preview.images[0].resolutions.pop(),
        media: post.data.media,
        permalink: `https://www.reddit.com${post.data.permalink}`,
        secure_media: post.data.secure_media,
        subreddit: `https://www.reddit.com/${post.data.subreddit_name_prefixed}`,
        thumbnail: post.data.thumbnail,
        title: post.data.title,
        type: post.data.post_hint,
        ups: post.data.ups,
        url: post.data.url
      })),
      after: json?.data?.after
    } as Posts

    // Send the response.
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=1, stale-while-revalidate=59'
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
