'use server'

import {logger} from '@/lib/axiom/server'
import type {
  ApiSubredditPostsResponse,
  RedditAutocompleteResponse,
  RedditPost,
  SearchAutocompleteItem,
  SubredditItem,
  TimeFilter
} from '@/lib/types/reddit'
import {
  CACHE_SEARCH,
  DEFAULT_POST_LIMIT,
  ONE_MINUTE
} from '@/lib/utils/constants'
import {RedditAPIError} from '@/lib/utils/errors'
import {isValidSubredditName} from '@/lib/utils/reddit-helpers'
import {
  GENERIC_ACTION_ERROR,
  GENERIC_SERVER_ERROR,
  getHeaders,
  getRequestMetadata,
  validateRedditUrl
} from './_helpers'

/**
 * Search Reddit for posts matching a query.
 * Server Action with Next.js fetch caching.
 * Results cached for 5 minutes. Includes NSFW content.
 *
 * @param query - Search query string
 * @param after - Pagination cursor for next page
 * @returns Promise resolving to posts array and next page cursor
 */
export async function searchReddit(
  query: string,
  after?: string
): Promise<{posts: RedditPost[]; after: string | null}> {
  try {
    if (!query || typeof query !== 'string' || query.length > 512) {
      logger.error('Invalid search query', {
        context: 'searchReddit',
        queryLength: query?.length
      })
      throw new Error(GENERIC_SERVER_ERROR)
    }

    const {headers, baseUrl, isAuthenticated} = await getHeaders()
    const url = new URL(`${baseUrl}/search.json`)
    validateRedditUrl(url.toString())

    url.searchParams.set('q', query)
    url.searchParams.set('limit', DEFAULT_POST_LIMIT.toString())
    url.searchParams.set('raw_json', '1')
    url.searchParams.set('include_over_18', 'on')
    if (after) {
      url.searchParams.set('after', after)
    }

    const response = await fetch(url.toString(), {
      headers,
      next: {
        revalidate: CACHE_SEARCH,
        tags: ['search', query]
      }
    })

    if (!response.ok) {
      const errorBody = await response.text()
      const requestMetadata = await getRequestMetadata()

      logger.error('Search request failed', {
        url: url.toString(),
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated,
        errorBody,
        context: 'searchReddit',
        query,
        ...requestMetadata
      })

      throw new RedditAPIError(
        GENERIC_SERVER_ERROR,
        'searchReddit',
        url.toString(),
        'GET',
        {query},
        response.status
      )
    }

    const data: ApiSubredditPostsResponse = await response.json()
    const posts = (data.data?.children?.map((child) => child.data) ??
      []) as RedditPost[]
    const afterCursor = data.data?.after ?? null

    logger.debug('Search successful', {
      query,
      count: posts.length,
      hasMore: !!afterCursor
    })

    return {posts, after: afterCursor}
  } catch (error) {
    logger.error('Error searching Reddit', {
      error: error instanceof Error ? error.message : String(error),
      context: 'searchReddit'
    })
    throw error
  }
}

/**
 * Search within a specific subreddit using Reddit's search API.
 * Server Action for searching posts within a subreddit.
 *
 * @param subreddit - Subreddit to search within
 * @param query - Search query (max 512 characters)
 * @param after - Optional pagination cursor
 * @param sort - Sort option (relevance, hot, top, new, comments). Default: relevance
 * @param time - Time filter for top sort (hour, day, week, month, year, all)
 * @returns Promise resolving to posts array and pagination cursor
 */
export async function searchSubreddit(
  subreddit: string,
  query: string,
  after?: string,
  sort: 'relevance' | 'hot' | 'top' | 'new' | 'comments' = 'relevance',
  time?: TimeFilter
): Promise<{posts: RedditPost[]; after: string | null}> {
  try {
    if (!isValidSubredditName(subreddit)) {
      logger.error('Invalid subreddit name', {
        context: 'searchSubreddit',
        subreddit
      })
      throw new Error(GENERIC_SERVER_ERROR)
    }

    if (!query || typeof query !== 'string' || query.length > 512) {
      logger.error('Invalid search query', {
        context: 'searchSubreddit',
        queryLength: query?.length
      })
      throw new Error(GENERIC_SERVER_ERROR)
    }

    const {headers, baseUrl, isAuthenticated} = await getHeaders()
    const url = new URL(`${baseUrl}/r/${subreddit}/search.json`)
    validateRedditUrl(url.toString())

    url.searchParams.set('q', query)
    url.searchParams.set('restrict_sr', 'true')
    url.searchParams.set('limit', DEFAULT_POST_LIMIT.toString())
    url.searchParams.set('raw_json', '1')
    url.searchParams.set('include_over_18', 'on')
    url.searchParams.set('sort', sort)
    if (after) {
      url.searchParams.set('after', after)
    }
    if (time && (sort === 'top' || sort === 'relevance')) {
      url.searchParams.set('t', time)
    }

    const response = await fetch(url.toString(), {
      headers,
      next: {
        revalidate: CACHE_SEARCH,
        tags: ['search', subreddit, query]
      }
    })

    if (!response.ok) {
      const errorBody = await response.text()
      const requestMetadata = await getRequestMetadata()

      logger.error('Subreddit search request failed', {
        url: url.toString(),
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated,
        errorBody,
        context: 'searchSubreddit',
        subreddit,
        query,
        ...requestMetadata
      })

      throw new RedditAPIError(
        GENERIC_SERVER_ERROR,
        'searchSubreddit',
        url.toString(),
        'GET',
        {subreddit, query},
        response.status
      )
    }

    const data: ApiSubredditPostsResponse = await response.json()
    const posts = (data.data?.children?.map((child) => child.data) ??
      []) as RedditPost[]
    const afterCursor = data.data?.after ?? null

    logger.debug('Subreddit search successful', {
      subreddit,
      query,
      count: posts.length,
      hasMore: !!afterCursor
    })

    return {posts, after: afterCursor}
  } catch (error) {
    logger.error('Error searching subreddit', {
      error: error instanceof Error ? error.message : String(error),
      context: 'searchSubreddit',
      subreddit
    })
    throw error
  }
}

/**
 * Search for subreddits using Reddit's autocomplete API.
 * Server Action for typeahead search suggestions.
 * Returns empty array for queries < 2 characters.
 * Results cached for 60 seconds.
 *
 * @param query - Search query (minimum 2 characters)
 * @returns Promise resolving to success status, results array, and optional error
 */
export async function searchSubreddits(query: string): Promise<{
  success: boolean
  data: SubredditItem[]
  error?: string
}> {
  if (!query || query.length < 2) {
    return {success: true, data: []}
  }

  if (typeof query !== 'string' || query.length > 100) {
    logger.error('Invalid subreddit search query', {
      context: 'searchSubreddits',
      queryLength: query?.length
    })
    return {success: false, data: [], error: GENERIC_ACTION_ERROR}
  }

  try {
    const {headers, baseUrl, isAuthenticated} = await getHeaders()

    const params = new URLSearchParams({
      query,
      raw_json: '1',
      limit: '10',
      include_over_18: 'true',
      include_profiles: 'false',
      typeahead_active: 'true'
    })

    const url = `${baseUrl}/api/subreddit_autocomplete_v2.json?${params}`
    validateRedditUrl(url)

    const response = await fetch(url, {
      headers,
      next: {
        revalidate: ONE_MINUTE,
        tags: ['search-subreddits']
      }
    })

    if (!response.ok) {
      const errorBody = await response.text()
      logger.error('Subreddit search request failed', {
        url,
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated,
        errorBody,
        context: 'searchSubreddits',
        query
      })

      if (response.status === 429) {
        const rateLimitMessage = isAuthenticated
          ? 'Reddit rate limit exceeded. Try again later.'
          : 'Reddit rate limit exceeded. Log in to continue.'
        return {success: false, data: [], error: rateLimitMessage}
      }

      throw new Error(GENERIC_SERVER_ERROR)
    }

    const data = (await response.json()) as RedditAutocompleteResponse

    const children = data?.data?.children || []

    const results: SubredditItem[] = children
      .map((child) => {
        const item: SubredditItem = {
          name: child.data?.display_name || '',
          displayName: child.data?.display_name_prefixed || '',
          icon: child.data?.icon_img || child.data?.community_icon || '',
          subscribers: child.data?.subscribers || 0,
          over18: child.data?.over18 === true
        }
        return item
      })
      .filter((item) => item.name)

    logger.debug('Subreddit search results', {
      query,
      count: results.length,
      nsfwCount: results.filter((r) => r.over18).length
    })
    return {success: true, data: results}
  } catch (error) {
    logger.error('Error searching subreddits', {
      error: error instanceof Error ? error.message : String(error),
      context: 'searchSubreddits'
    })
    return {success: false, data: [], error: GENERIC_ACTION_ERROR}
  }
}

/**
 * Search for subreddits and user profiles using Reddit's autocomplete API.
 * Returns both communities and user profiles, tagged with a `type` field.
 * Results cached for 60 seconds.
 *
 * @param query - Search query (minimum 2 characters)
 * @returns Promise resolving to success status, results array, and optional error
 */
export async function searchSubredditsAndUsers(query: string): Promise<{
  success: boolean
  data: SearchAutocompleteItem[]
  error?: string
}> {
  if (!query || query.length < 2) {
    return {success: true, data: []}
  }

  if (typeof query !== 'string' || query.length > 100) {
    logger.error('Invalid autocomplete search query', {
      context: 'searchSubredditsAndUsers',
      queryLength: query?.length
    })
    return {success: false, data: [], error: GENERIC_ACTION_ERROR}
  }

  try {
    const {headers, baseUrl, isAuthenticated} = await getHeaders()

    const params = new URLSearchParams({
      query,
      raw_json: '1',
      limit: '10',
      include_over_18: 'true',
      include_profiles: 'true',
      typeahead_active: 'true'
    })

    const url = `${baseUrl}/api/subreddit_autocomplete_v2.json?${params}`
    validateRedditUrl(url)

    const response = await fetch(url, {
      headers,
      next: {
        revalidate: ONE_MINUTE,
        tags: ['search-autocomplete']
      }
    })

    if (!response.ok) {
      const errorBody = await response.text()
      logger.error('Subreddit/user autocomplete request failed', {
        url,
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        isAuthenticated,
        errorBody,
        context: 'searchSubredditsAndUsers',
        query
      })

      if (response.status === 429) {
        const rateLimitMessage = isAuthenticated
          ? 'Reddit rate limit exceeded. Try again later.'
          : 'Reddit rate limit exceeded. Log in to continue.'
        return {success: false, data: [], error: rateLimitMessage}
      }

      throw new Error(GENERIC_SERVER_ERROR)
    }

    const data = (await response.json()) as RedditAutocompleteResponse

    const children = data?.data?.children || []

    const results: SearchAutocompleteItem[] = children
      .map((child) => {
        const prefixed = child.data?.display_name_prefixed || ''
        const type: 'subreddit' | 'user' = prefixed.startsWith('u/')
          ? 'user'
          : 'subreddit'
        const item: SearchAutocompleteItem = {
          name: child.data?.display_name || '',
          displayName: prefixed,
          icon: child.data?.icon_img || child.data?.community_icon || '',
          subscribers: child.data?.subscribers || 0,
          over18: child.data?.over18 === true,
          type
        }
        return item
      })
      .filter((item) => item.name)

    return {success: true, data: results}
  } catch (error) {
    logger.error('Error searching subreddits and users', {
      error: error instanceof Error ? error.message : String(error),
      context: 'searchSubredditsAndUsers'
    })
    return {success: false, data: [], error: GENERIC_ACTION_ERROR}
  }
}
