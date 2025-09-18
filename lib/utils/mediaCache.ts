/**
 * Interface for cache entries.
 */
interface CacheEntry {
  url: string
  timestamp: number
}

/**
 * Simple cache for media URLs with expiration and size limits.
 */
export class MediaCache {
  private readonly cache: Map<string, CacheEntry>
  private readonly maxSize: number
  private readonly maxAge: number // milliseconds

  constructor(maxSize = 1000, maxAgeMinutes = 30) {
    this.cache = new Map()
    this.maxSize = maxSize
    this.maxAge = maxAgeMinutes * 60 * 1000
  }

  /**
   * Check if the URL exists and is still valid in the cache.
   * @param url - The URL to check
   * @returns true if cached and valid
   */
  has(url: string): boolean {
    const entry = this.cache.get(url)
    const now = Date.now()

    if (entry && now - entry.timestamp < this.maxAge) {
      return true
    }

    if (entry) {
      this.cache.delete(url)
    }

    return false
  }

  /**
   * Retrieve a cached URL if it's valid.
   * @param url - The URL to retrieve
   * @returns The cached URL or null
   */
  get(url: string): string | null {
    try {
      new URL(url)
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[MediaCache] Invalid URL:', url, error)
      }
      return null
    }

    return this.has(url) ? url : null
  }

  /**
   * Add or update a URL in the cache.
   * @param url - The URL to cache
   */
  add(url: string): void {
    try {
      new URL(url)
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[MediaCache] Invalid URL (add):', url, error)
      }
      return
    }

    this.cache.set(url, {url, timestamp: Date.now()})
    this.cleanup()
  }

  /**
   * Prefetch media content and cache the URL.
   * @param url - The URL to prefetch
   * @param type - 'image' or 'video'
   * @returns Promise that resolves when prefetch is complete
   */
  async prefetch(
    url: string,
    type: 'image' | 'video' = 'image'
  ): Promise<void> {
    let link: HTMLLinkElement | null = null
    let loaded = false

    try {
      if (this.has(url)) return

      new URL(url) // validate

      link = document.createElement('link')
      link.rel = 'preload'
      link.as = type
      link.href = url
      document.head.appendChild(link)

      await Promise.race([
        new Promise<void>((resolve) => {
          link!.onload = () => {
            loaded = true
            resolve()
          }
          link!.onerror = () => resolve()
        }),
        new Promise<void>((resolve) => setTimeout(resolve, 5000))
      ])

      if (loaded) {
        this.add(url)
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[MediaCache] Prefetch failed (${type}):`, url, error)
      }
    } finally {
      link?.parentNode?.removeChild(link)
    }
  }

  /**
   * Clear the cache entirely.
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Remove expired entries and enforce size limit.
   */
  private cleanup(): void {
    const now = Date.now()

    const expired: string[] = []
    for (const [url, entry] of this.cache) {
      if (now - entry.timestamp > this.maxAge) {
        expired.push(url)
      }
    }
    expired.forEach((url) => this.cache.delete(url))

    if (this.cache.size > this.maxSize) {
      const entries = Array.from(this.cache.entries()).sort(
        ([_aKey, a], [_bKey, b]) => a.timestamp - b.timestamp
      )
      const toRemove = entries.slice(0, this.cache.size - this.maxSize)
      for (const [url] of toRemove) {
        this.cache.delete(url)
      }
    }
  }

  /**
   * Current cache size.
   */
  get size(): number {
    return this.cache.size
  }
}

// Create singleton instance
const mediaCache = new MediaCache()

// Export helpers
export const getCachedUrl = (url: string): string => mediaCache.get(url) ?? url

export const prefetchMedia = (
  url: string,
  type: 'image' | 'video' = 'image'
): Promise<void> => mediaCache.prefetch(url, type)
