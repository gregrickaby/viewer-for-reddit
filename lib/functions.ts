import config from '@/lib/config'
import {FetchSubredditProps, RedditPostResponse} from '@/lib/types'
import {fetchToken} from '@/lib/actions'

/**
 * Fetch subreddit posts.
 */
export async function fetchSubredditPosts(
  props: FetchSubredditProps
): Promise<RedditPostResponse> {
  try {
    // Destructure props.
    const {slug, sortBy, limit, after} = props

    // Fetch the Reddit oAuth token.
    const {access_token} = await fetchToken()

    // Fetch the subreddit posts.
    const response = await fetch(
      `https://oauth.reddit.com/r/${slug}/${sortBy}/.json?limit=${limit}&after=${after}&raw_json=1`,
      {
        headers: {
          'User-Agent': config.userAgent,
          authorization: `Bearer ${access_token}`
        },
        next: {
          tags: [slug],
          revalidate: config.cacheTtl
        }
      }
    )

    // Bad response? Bail.
    if (!response.ok) {
      throw new Error(` ${response.statusText}: /r/${slug}`)
    }

    // Parse the response.
    const data = (await response.json()) as RedditPostResponse

    // If the response is empty, bail.
    if (!data.data) {
      throw new Error('Failed to parse subreddit response.')
    }

    // Return the posts.
    return {
      kind: data.kind,
      data: {
        modhash: data.data.modhash,
        dist: data.data.dist,
        children: data.data.children.filter(
          ({data}) =>
            data.post_hint && data.post_hint !== 'self' && !data.poststickied // Exclude self/stickied posts.
        ),
        after: data.data.after,
        before: data.data.before
      }
    }
  } catch (error) {
    console.error(`Exception thrown in fetchSubredditPosts(): ${error}`)
    return {error: `${error}`}
  }
}
