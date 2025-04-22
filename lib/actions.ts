'use server'

import config from '@/lib/config'
import {logError} from '@/lib/functions'
import {
  FetchSubredditProps,
  RedditAboutResponse,
  RedditPopularResponse,
  RedditPostResponse,
  RedditSearchResponse,
  RedditTokenResponse
} from '@/lib/types'

function validateEnvVars() {
  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Missing Reddit environment variables!')
  }

  return {clientId, clientSecret}
}

export async function fetchToken(): Promise<RedditTokenResponse> {
  try {
    const {clientId, clientSecret} = validateEnvVars()
    const url = new URL('https://www.reddit.com/api/v1/access_token')
    url.search = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'read',
      device_id: 'DO_NOT_TRACK_THIS_DEVICE'
    }).toString()

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': config.userAgent,
      Authorization:
        'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      next: {
        tags: ['token'],
        revalidate: 86400
      }
    })

    if (!response.ok) throw new Error('Failed to fetch Reddit oAuth Token.')

    const data: RedditTokenResponse = await response.json()
    if (!data.access_token)
      throw new Error(data.error ?? 'No access token in response')

    return data
  } catch (error) {
    logError(`Exception in fetchToken(): ${error}`)
    return {error: String(error)}
  }
}

export async function fetchPopularSubreddits(): Promise<RedditPopularResponse> {
  try {
    const {access_token} = await fetchToken()
    if (!access_token)
      throw new Error('No access_token returned from fetchToken()')

    const url = new URL('https://oauth.reddit.com/subreddits/popular/.json')
    url.searchParams.set('limit', '11')

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': config.userAgent,
      Authorization: `Bearer ${access_token}`
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      next: {
        tags: ['popular'],
        revalidate: config.cacheTtl
      }
    })

    if (!response.ok)
      throw new Error(
        `Reddit API returned ${response.status}: ${response.statusText}`
      )

    const data: RedditPopularResponse = await response.json()
    if (!data.data)
      throw new Error('Response was successful but missing `data` field.')

    const filteredChildren = data.data.children.filter(
      ({data}) => data.display_name.toLowerCase() !== 'home'
    )

    filteredChildren.sort((a, b) =>
      a.data.display_name.localeCompare(b.data.display_name)
    )

    return {
      kind: data.kind,
      data: {
        modhash: data.data.modhash,
        dist: data.data.dist,
        children: filteredChildren,
        after: data.data.after,
        before: data.data.before
      }
    }
  } catch (error) {
    logError(`Exception in fetchPopularSubreddits(): ${error}`)
    return {error: String(error)}
  }
}

export async function fetchSearchResults(
  query: string
): Promise<RedditSearchResponse> {
  try {
    const {access_token} = await fetchToken()
    if (!access_token) throw new Error('Failed to fetch Reddit oAuth Token.')

    const url = new URL(
      'https://oauth.reddit.com/api/subreddit_autocomplete_v2'
    )
    url.search = new URLSearchParams({
      query: encodeURIComponent(query.trim()),
      limit: '10',
      include_over_18: 'true',
      include_profiles: 'false',
      typeahead_active: 'true',
      search_query_id: 'DO_NOT_TRACK'
    }).toString()

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': config.userAgent,
      Authorization: `Bearer ${access_token}`
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      next: {
        tags: [`search-${query}`],
        revalidate: 86400
      }
    })

    if (!response.ok)
      throw new Error(`Failed to fetch search results. ${response.statusText}`)

    const data: RedditSearchResponse = await response.json()
    if (!data.data) throw new Error('Failed to parse search results.')

    return data
  } catch (error) {
    logError(`Exception in fetchSearchResults(): ${error}`)
    return {error: String(error)}
  }
}

export async function fetchSubredditPosts(
  props: FetchSubredditProps
): Promise<RedditPostResponse> {
  try {
    const {access_token} = await fetchToken()
    if (!access_token) throw new Error('Failed to fetch Reddit oAuth Token.')

    let {slug, sort, limit = 10, after = ''} = props

    const validSorts = ['hot', 'new', 'top', 'rising']
    if (!validSorts.includes(sort)) throw new Error(`Invalid sort: ${sort}`)
    if (limit < 1 || limit > 100) throw new Error(`Invalid limit: ${limit}`)
    if (after && !/^\w+$/.test(after))
      throw new Error(`Invalid after param: ${after}`)

    const url = new URL(`https://oauth.reddit.com/r/${slug}/${sort}/.json`)
    url.search = new URLSearchParams({
      limit: limit.toString(),
      after,
      raw_json: '1'
    }).toString()

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': config.userAgent,
      Authorization: `Bearer ${access_token}`
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      next: {
        tags: [`posts-${slug}-${sort}-${limit}-${after}`],
        revalidate: config.cacheTtl
      }
    })

    const rlUsed = response.headers.get('X-Ratelimit-Used')
    const rlRemaining = response.headers.get('X-Ratelimit-Remaining')
    const rlReset = response.headers.get('X-Ratelimit-Reset')

    if (!response.ok) {
      throw new Error(
        `Failed to fetch subreddit posts. ${response.statusText} | ${slug} | Rate Limit: used=${rlUsed}, remaining=${rlRemaining}, reset=${rlReset}`
      )
    }

    const data: RedditPostResponse = await response.json()
    if (!data.data) throw new Error('Failed to parse subreddit posts.')

    const filteredChildren = data.data.children.filter(
      ({data}) => !data.poststickied
    )

    return {
      kind: data.kind,
      data: {
        modhash: data.data.modhash,
        dist: data.data.dist,
        children: filteredChildren,
        after: data.data.after,
        before: data.data.before
      }
    }
  } catch (error) {
    logError(`Exception in fetchSubredditPosts(): ${error}`)
    return {error: String(error)}
  }
}

export async function fetchSubredditAbout(
  slug: string
): Promise<RedditAboutResponse> {
  try {
    const {access_token} = await fetchToken()
    if (!access_token) throw new Error('Failed to fetch Reddit oAuth Token.')

    slug = encodeURIComponent(slug.trim())
    const url = new URL(`https://oauth.reddit.com/r/${slug}/about/.json`)

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': config.userAgent,
      Authorization: `Bearer ${access_token}`
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      next: {
        tags: [`about-${slug}`],
        revalidate: 86400
      }
    })

    if (!response.ok) throw new Error(`${response.statusText}: /r/${slug}`)

    const data: RedditAboutResponse = await response.json()
    if (!data.data) throw new Error('Failed to parse subreddit about response.')

    return data
  } catch (error) {
    logError(`Exception in fetchSubredditAbout(): ${error}`)
    return {error: String(error)}
  }
}
