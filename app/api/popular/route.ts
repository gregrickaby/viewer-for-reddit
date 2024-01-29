import config from '@/lib/config'
import {fetchToken} from '@/lib/functions'

/**
 * Route segment config.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
 */
export const runtime = 'edge'

/**
 * Popular Subreddit Reddit API.
 *
 * @example
 * /api/popular?limit=5
 *
 * @see https://www.reddit.com/dev/api#GET_subreddits_{where}
 * @see https://nextjs.org/docs/app/building-your-application/routing/route-handlers
 * @see https://nextjs.org/docs/pages/api-reference/edge
 */
export async function GET() {
  try {
    // Get the access token.
    const {token} = await fetchToken()

    // Attempt to fetch subreddits.
    const response = await fetch(
      `https://oauth.reddit.com/subreddits/popular?limit=${config.redditApi.popularLimit}`,
      {
        headers: {
          authorization: `Bearer ${token}`
        },
        next: {revalidate: config.cacheTtl}
      }
    )

    // No response? Bail...
    if (response.status != 200) {
      return new Response(
        JSON.stringify({
          error: `${response.statusText}`
        }),
        {
          headers: {
            'X-Robots-Tag': 'noindex'
          },
          status: response.status,
          statusText: response.statusText
        }
      )
    }

    // Parse the response.
    const subs = await response.json()

    // No data in the response? Bail...
    if (!subs.data && !subs.data.children.length) {
      return new Response(
        JSON.stringify({
          error: `No data returned from Reddit.`
        }),
        {
          headers: {
            'X-Robots-Tag': 'noindex'
          },
          status: 400,
          statusText: 'Bad Request'
        }
      )
    }

    // Filter uneeded data to keep the payload small.
    const filtered = subs.data.children.map(
      (sub: {data: {over18?: string; url?: string; display_name?: string}}) => {
        return {
          over_18: sub.data.over18 ? true : false,
          url: sub.data.url ? sub.data.url : '',
          value: sub.data.display_name ? sub.data.display_name : ''
        }
      }
    )

    // Send the response.
    return new Response(JSON.stringify(filtered), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, s-maxage=${config.cacheTtl}`,
        'CDN-Cache-Control': `public, s-maxage=${config.cacheTtl}`,
        'Vercel-CDN-Cache-Control': `public, s-maxage=${config.cacheTtl}`
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
