'use server'

import config from '@/lib/config'
import {
  FetchSubredditProps,
  RedditAboutResponse,
  RedditPostResponse,
  RedditSearchResponse,
  RedditTokenResponse
} from '@/lib/types'

/**
 * Fetch a Reddit oAuth token.
 *
 * @see https://github.com/reddit-archive/reddit/wiki/OAuth2#application-only-oauth
 */
export async function fetchToken(): Promise<RedditTokenResponse> {
  try {
    // Fetch the Reddit oAuth token.
    const response = await fetch(
      'https://www.reddit.com/api/v1/access_token?grant_type=client_credentials&scope=read&device_id=DO_NOT_TRACK_THIS_DEVICE',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': config.userAgent,
          Authorization: `Basic ${btoa(
            `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
          )}`
        },
        next: {
          tags: ['token'],
          revalidate: config.cacheTtl
        }
      }
    )

    // Bad response? Bail.
    if (!response.ok) {
      throw new Error('Failed to fetch Reddit oAuth Token.')
    }

    // Parse the response.
    const data = (await response.json()) as RedditTokenResponse

    // If the response is empty, bail.
    if (!data.access_token) {
      throw new Error(data.error)
    }

    // Return the token.
    return {
      access_token: data.access_token
    }
  } catch (error) {
    console.error(`Exception thrown in fetchToken(): ${error}`)
    return {error: `${error}`}
  }
}

/**
 * Fetch search results.
 */
export async function fetchSearchResults(
  query: string
): Promise<RedditSearchResponse> {
  try {
    // Get the access token.
    const {access_token} = await fetchToken()

    // No token? Bail.
    if (!access_token) {
      throw new Error('Failed to fetch Reddit oAuth Token.')
    }

    // Validate and sanitize the query.
    query = query && query.replace(/[^a-zA-Z0-9_]/g, '')

    // Attempt to fetch subreddits.
    const response = await fetch(
      `https://oauth.reddit.com/api/subreddit_autocomplete_v2?query=${query}&limit=10&include_over_18=true&include_profiles=false&typeahead_active=true&search_query_id=DO_NOT_TRACK`,
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': config.userAgent,
          Authorization: `Bearer ${access_token}`
        },
        next: {
          revalidate: config.cacheTtl
        }
      }
    )
    // Bad response? Bail.
    if (!response.ok) {
      throw new Error(`Failed to fetch search results. ${response.statusText}`)
    }

    // Parse the response.
    const data = (await response.json()) as RedditSearchResponse

    // If the response is empty, bail.
    if (!data.data) {
      throw new Error('Failed to parse search results.')
    }

    // Return the search results.
    return data
  } catch (error) {
    console.error(`Exception thrown in fetchSearchResults(): ${error}`)
    return {error: `${error}`}
  }
}

/**
 * Fetch subreddit posts.
 *
 * @see
 */
export async function fetchSubredditPosts(
  props: FetchSubredditProps
): Promise<RedditPostResponse> {
  try {
    // Fetch the Reddit oAuth token.
    const {access_token} = await fetchToken()

    // No token? Bail.
    if (!access_token) {
      throw new Error('Failed to fetch Reddit oAuth Token.')
    }

    // Destructure props.
    let {slug, sort, limit, after} = props

    // Validate and sanitize the slug param.
    slug = slug && slug.replace(/[^a-zA-Z0-9_]/g, '')

    // Validate the sort param.
    if (!['hot', 'new', 'top', 'rising'].includes(sort)) {
      throw new Error(
        'Invalid sort parameter. Allowed values: hot, new, top, rising.'
      )
    }

    // Validate the limit param.
    if ((limit && limit < 1) || limit > 100) {
      throw new Error('Invalid limit parameter. Allowed values: 1-100.')
    }

    // Validate the after param.
    if (after && !after.match(/^[a-zA-Z0-9_]+$/)) {
      throw new Error('Invalid after parameter. Must be alphanumeric.')
    }

    // Fetch the subreddit posts.
    const response = await fetch(
      `https://oauth.reddit.com/r/${slug}/${sort}/.json?limit=${limit}&after=${after}&raw_json=1`,
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': config.userAgent,
          Authorization: access_token
        },
        next: {
          tags: [`posts-${slug}-${sort}-${limit}-${after}`],
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

/**
 * Fetch subreddit about information.
 *
 * @see https://www.reddit.com/dev/api/oauth#GET_r_{subreddit}_about
 */
export async function fetchSubredditAbout(
  slug: string
): Promise<RedditAboutResponse> {
  try {
    // Fetch the Reddit oAuth token.
    const {access_token} = await fetchToken()

    // No token? Bail.
    if (!access_token) {
      throw new Error('Failed to fetch Reddit oAuth Token.')
    }

    // Validate and sanitize the slug param.
    slug = slug && slug.replace(/[^a-zA-Z0-9_]/g, '')

    // Fetch the subreddit about.
    const response = await fetch(
      `https://oauth.reddit.com/r/${slug}/about/.json`,
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': config.userAgent,
          Authorization: access_token
        },
        next: {
          tags: [`about-${slug}`],
          revalidate: config.cacheTtl
        }
      }
    )

    // Bad response? Bail.
    if (!response.ok) {
      throw new Error(` ${response.statusText}: /r/${slug}`)
    }

    // Parse the response.
    const data = (await response.json()) as RedditAboutResponse

    // If the response is empty, bail.
    if (!data.data) {
      throw new Error('Failed to parse subreddit about response.')
    }

    // Return the about.
    return data
  } catch (error) {
    console.error(`Exception thrown in fetchSubredditAbout(): ${error}`)
    return {error: `${error}`}
  }
}
