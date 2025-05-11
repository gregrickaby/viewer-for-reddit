interface RedditApiResponse<Child> {
  data?: {
    children?: Array<{data?: Child}>
  }
}

export function extractChildren<T>(response: RedditApiResponse<T>): T[] {
  return (
    response.data?.children
      ?.map((child) => child.data)
      .filter((data): data is T => data !== undefined) ?? []
  )
}
