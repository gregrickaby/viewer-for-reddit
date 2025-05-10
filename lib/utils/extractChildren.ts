interface RedditApiResponse<Child> {
  data?: {
    children?: Array<{data?: Child}>
  }
}

/**
 * Extracts the `.data` field from each child in a Reddit API response.
 *
 * @param response - A Reddit-like API response with a `children` array.
 * @returns An array of child data.
 */
export function extractChildren<T>(response: RedditApiResponse<T>): T[] {
  return (
    response.data?.children
      ?.map((child) => child.data)
      .filter((data): data is T => data !== undefined) ?? []
  )
}
