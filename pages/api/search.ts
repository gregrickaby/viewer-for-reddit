import type {NextRequest} from 'next/server'

export const config = {
  runtime: 'experimental-edge'
}

/**
 * Search Reddit API.
 *
 * @example
 * /api/search?term=itookapicture
 *
 * @see https://www.reddit.com/dev/api#GET_api_subreddit_autocomplete_v2
 * @see https://nextjs.org/docs/api-routes/edge-api-routes
 * @see https://nextjs.org/docs/api-reference/edge-runtime
 */
export default async function search(req: NextRequest) {
  // Get query params from request.
  const term = new URL(req.url).searchParams.get('term') || ''

  try {
    // Attempt to fetch subreddits.
    const response = await fetch(
      `https://oauth.reddit.com/api/subreddit_autocomplete_v2?query=${term}&include_over_18=true&include_profiles=true&typeahead_active=true&search_query_id=6224f443-366f-48b7-9036-3a340e4df6df`,
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
    const filtered = subs.data.children.map((sub) => {
      return {
        over18: sub.data.over18 ? true : false,
        url: sub.data.url ? sub.data.url : '',
        value: sub.data.display_name ? sub.data.display_name : ''
      }
    })

    // Send the response.
    return new Response(JSON.stringify(filtered), {
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
