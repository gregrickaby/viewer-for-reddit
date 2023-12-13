import config from '@/lib/config'

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
 * /api/preSearch?limit=5
 *
 * @see https://www.reddit.com/dev/api#GET_subreddits_{where}
 * @see https://nextjs.org/docs/app/building-your-application/routing/route-handlers
 * @see https://nextjs.org/docs/pages/api-reference/edge
 */
export async function GET(request: Request) {
  // Get query params from request.
  const {searchParams} = new URL(request.url)

  // Parse params.
  const unsanitizedLimit = searchParams.get('limit') || ''

  // Parse and sanitize query params from request.
  const limit = unsanitizedLimit
    ? encodeURIComponent(unsanitizedLimit)
    : config.redditApi.preSearchLimit

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

    // Attempt to fetch subreddits.
    const response = await fetch(
      `https://oauth.reddit.com/subreddits/popular?limit=${limit}`,
      {
        headers: {
          authorization: `Bearer ${token.access_token}`
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
    const subs = await response.json()

    // No data in the response? Bail...
    if (!subs.data && !subs.data.children.length) {
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
