/**
 * Global fetcher function for useSWR.
 */
export async function fetcher(url: RequestInfo, init?: RequestInit) {
  const response = await fetch(url, init)

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }

  return response.json()
}

interface FetchPostsProps {
  lastPost?: string
  limit?: number
  sort?: string
  subReddit: string
}

/**
 * Fetches posts from internal Reddit API.
 */
export async function fetchPosts({
  limit,
  lastPost,
  sort,
  subReddit
}: FetchPostsProps) {
  const after = lastPost ? lastPost : ''
  const number = limit ? limit : '24'
  const sortBy = sort ? sort : 'hot'
  const sub = subReddit ? subReddit : 'itookapicture'

  try {
    // Try and fetch posts.
    const response = await fetch(
      `/api/reddit?sub=${sub}&sort=${sortBy}&limit=${number}&after=${after}`,
      {
        cache: 'default'
      }
    )

    // Bad response? Bail...
    if (response.status != 200) {
      return {
        error: `${response.statusText}`
      }
    }

    // Return posts.
    return await response.json()
  } catch (error) {
    // Issue? Leave a message and bail.
    console.error(error)
    return {
      error: `${error}`
    }
  }
}

/**
 * Get cache.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Cache
 */
export async function getCache(cacheName: string, url: string) {
  // Try and get the cache.
  try {
    // Initialize cache.
    const cacheStorage = await caches.open(cacheName)

    // Attempt to get data from cache.
    const cachedResponse = await cacheStorage.match(url)

    // Cache miss? Then run the request and cache the response.
    if (!cachedResponse || cachedResponse.status !== 200) {
      await cacheStorage.add(url)
      return (await cacheStorage.match(url)).json()
    }

    // Cache hit? Return the cached response.
    return cachedResponse.json()
  } catch (error) {
    // Issue? Leave a message and bail.
    console.error(error)
    return {
      error: `There was an issue with the cache: ${error}`
    }
  }
}

/**
 * Delete cache.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Cache/delete
 */
export async function deleteCache(cacheName: string, url: string) {
  return await caches.open(cacheName).then((cache) => cache.delete(url))
}
