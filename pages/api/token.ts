import type {NextRequest} from 'next/server'

export const config = {
  runtime: 'experimental-edge'
}

/**
 * Generate a new Reddit API application-only access token.
 *
 * @example
 * /api/token?authorization_key=[1234]
 *
 * @see https://github.com/reddit-archive/reddit/wiki/OAuth2#application-only-oauth
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Cache
 * @see https://nextjs.org/docs/api-routes/edge-api-routes
 * @see https://nextjs.org/docs/api-reference/edge-runtime
 */
export default async function token(req: NextRequest) {
  // Get query params from request.
  const {searchParams} = new URL(req.url)

  // Parse and sanitize params.
  const authorizationKey = encodeURI(searchParams.get('authorization_key'))

  // No authorization key? Bail...
  if (!authorizationKey) {
    return new Response(
      JSON.stringify({
        error: 'Missing authorization key.'
      }),
      {
        status: 401,
        statusText: 'Unauthorized'
      }
    )
  }

  // Generate random device ID.
  // @see https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
  const array = new Uint32Array(24)
  const deviceId = self.crypto.getRandomValues(array)

  try {
    // Try and fetch a new access token.
    const tokenResponse = await fetch(
      `https://www.reddit.com/api/v1/access_token?grant_type=client_credentials&device_id=${deviceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json charset=UTF-8',
          'User-Agent': 'reddit-image-viewer/* by Greg Rickaby',
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

    // Return the access token.
    return new Response(JSON.stringify(token), {
      status: 200,
      statusText: 'OK'
    })
  } catch (error) {
    // Issue? Leave a message and bail.
    console.error(error)
    return new Response(JSON.stringify({error: `${error}`}), {
      status: 500,
      statusText: error.message
    })
  }
}
