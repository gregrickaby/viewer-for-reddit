'use server'

import {getRedditContext} from '@/lib/auth/reddit-context'
import {logger} from '@/lib/datadog/server'
import type {
  ApiSubredditPostsResponse,
  RedditAutocompleteItem,
  RedditAutocompleteResponse,
  RedditListingChild,
  RedditPost,
  SearchAutocompleteItem,
  SubredditItem,
  TimeFilter
} from '@/lib/types/reddit'
import {
  CACHE_AUTOCOMPLETE,
  CACHE_SEARCH,
  DEFAULT_POST_LIMIT
} from '@/lib/utils/constants'
import {getErrorMessage} from '@/lib/utils/errors'
import {isValidSubredditName} from '@/lib/utils/reddit-helpers'
import {
  GENERIC_ACTION_ERROR,
  GENERIC_SERVER_ERROR,
  assertRedditUrl,
  circuitProtectedFetch,
  logFailedResponse
} from './_helpers'
import {redditFetch} from './redditFetch'

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

    const searchParams: Record<string, string> = {
      q: query,
      limit: DEFAULT_POST_LIMIT.toString(),
      include_over_18: 'on'
    }
    if (after) {
      searchParams.after = after
    }

    const data = await redditFetch<ApiSubredditPostsResponse>('/search.json', {
      searchParams,
      cache: {
        revalidate: CACHE_SEARCH,
        tags: ['search', query]
      },
      operation: 'searchReddit',
      resource: query
    })

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
      error: getErrorMessage(error),
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

    const searchParams: Record<string, string> = {
      q: query,
      restrict_sr: 'true',
      limit: DEFAULT_POST_LIMIT.toString(),
      include_over_18: 'on',
      sort
    }
    if (after) {
      searchParams.after = after
    }
    if (time && (sort === 'top' || sort === 'relevance')) {
      searchParams.t = time
    }

    const data = await redditFetch<ApiSubredditPostsResponse>(
      `/r/${subreddit}/search.json`,
      {
        searchParams,
        cache: {
          revalidate: CACHE_SEARCH,
          tags: ['search', subreddit, query]
        },
        operation: 'searchSubreddit',
        resource: subreddit
      }
    )

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
      error: getErrorMessage(error),
      context: 'searchSubreddit',
      subreddit
    })
    throw error
  }
}

/**
 * Query Reddit's subreddit/user autocomplete endpoint.
 * Shared by {@link searchSubreddits} and {@link searchSubredditsAndUsers} -
 * the two differ only in whether user profiles are included and how
 * results are mapped.
 *
 * @param query - Search query (minimum 2 characters)
 * @param includeProfiles - Whether to include user profiles in results
 * @param operation - Operation name for logging (matches the public function name)
 * @returns Promise resolving to the raw autocomplete listing children, or a failure result
 */
async function fetchAutocomplete(
  query: string,
  includeProfiles: boolean,
  operation: string
): Promise<
  | {success: true; children: RedditListingChild<RedditAutocompleteItem>[]}
  | {success: false; error: string}
> {
  if (typeof query !== 'string' || query.length > 100) {
    logger.error('Invalid autocomplete search query', {
      context: operation,
      queryLength: query?.length
    })
    return {success: false, error: GENERIC_ACTION_ERROR}
  }

  try {
    const {headers, baseUrl} = await getRedditContext()

    const params = new URLSearchParams({
      query,
      raw_json: '1',
      limit: '10',
      include_over_18: 'true',
      include_profiles: includeProfiles ? 'true' : 'false',
      typeahead_active: 'true'
    })

    const url = `${baseUrl}/api/subreddit_autocomplete_v2.json?${params}`
    assertRedditUrl(url)

    const response = await circuitProtectedFetch(url, {
      headers,
      next: {
        revalidate: CACHE_AUTOCOMPLETE,
        tags: [includeProfiles ? 'search-autocomplete' : 'search-subreddits']
      }
    })

    if (!response.ok) {
      await logFailedResponse(response, url, 'GET', operation, {query})
      return {success: false, error: GENERIC_ACTION_ERROR}
    }

    const data = (await response.json()) as RedditAutocompleteResponse
    return {success: true, children: data?.data?.children || []}
  } catch (error) {
    if (error instanceof Error && error.message === 'Not authenticated') {
      logger.debug('Autocomplete search skipped - not authenticated', {
        context: operation
      })
      return {success: false, error: 'Sign in to search Reddit'}
    }
    logger.error('Error fetching autocomplete results', {
      error: getErrorMessage(error),
      context: operation
    })
    return {success: false, error: GENERIC_ACTION_ERROR}
  }
}

/**
 * Search for subreddits using Reddit's autocomplete API.
 * Server Action for typeahead search suggestions.
 * Returns empty array for queries < 2 characters.
 * Results cached for 60 seconds.
 *
 * Uses manual fetch with {@link getRedditContext} (not {@link redditFetch}).
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

  const result = await fetchAutocomplete(query, false, 'searchSubreddits')
  if (!result.success) {
    return {success: false, data: [], error: result.error}
  }

  const results: SubredditItem[] = result.children
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
}

/**
 * Search for subreddits and user profiles using Reddit's autocomplete API.
 * Returns both communities and user profiles, tagged with a `type` field.
 * Results cached for 60 seconds.
 *
 * Uses manual fetch with {@link getRedditContext} (not {@link redditFetch}).
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

  const result = await fetchAutocomplete(
    query,
    true,
    'searchSubredditsAndUsers'
  )
  if (!result.success) {
    return {success: false, data: [], error: result.error}
  }

  const results: SearchAutocompleteItem[] = result.children
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
}
