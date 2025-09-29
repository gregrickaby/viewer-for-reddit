interface RedditApiResponse<Child> {
  data?: {
    children?: Array<{data?: Child}>
  }
}

/**
 * Extracts and filters children data from Reddit API responses.
 *
 * Reddit API responses follow a consistent pattern where the actual data is nested
 * within a `data.children` array structure. This utility function safely extracts
 * the data objects from this structure while filtering out any undefined entries.
 *
 * @param response - The Reddit API response object with the expected structure
 * @returns Array of extracted and filtered data objects
 *
 * @example
 * ```typescript
 * const response = {
 *   data: {
 *     children: [
 *       { data: { id: '1', title: 'Post 1' } },
 *       { data: undefined },
 *       { data: { id: '2', title: 'Post 2' } }
 *     ]
 *   }
 * }
 * const posts = extractChildren(response)
 * // Returns: [{ id: '1', title: 'Post 1' }, { id: '2', title: 'Post 2' }]
 * ```
 */
export function extractChildren<T>(response: RedditApiResponse<T>): T[] {
  return (
    response.data?.children
      ?.map((child) => child.data)
      .filter((data): data is T => data !== undefined) ?? []
  )
}
