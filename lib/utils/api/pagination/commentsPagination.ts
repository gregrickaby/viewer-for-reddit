/**
 * Type for Reddit listing responses with pagination.
 */
type ListingResponse = {
  data?: {
    after?: string | null
    children?: unknown[]
  }
}

/**
 * Extract the comments listing from a Reddit API response.
 *
 * Post comment endpoints return an array where index [1] contains the comments listing,
 * while user comment endpoints return the listing directly.
 *
 * @param response - Raw Reddit API response (array or listing)
 * @returns The comments listing
 */
export function extractCommentsListing<T extends ListingResponse>(
  response: T[] | T
): T {
  return Array.isArray(response) ? response[1] : response
}

/**
 * Create infinite query options for Reddit comments pagination.
 *
 * @param maxPages - Maximum number of pages to load (default: 10)
 * @returns InfiniteQueryOptions configuration
 */
export function createCommentsInfiniteConfig<T extends ListingResponse>(
  maxPages = 10
) {
  return {
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: T[] | T) => {
      const commentsListing = extractCommentsListing(lastPage)
      return commentsListing?.data?.after ?? undefined
    },
    getPreviousPageParam: () => undefined,
    maxPages
  }
}
