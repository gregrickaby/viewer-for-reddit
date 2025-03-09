/**
 * Interface for cache entries.
 */
interface CacheEntry {
  /* The URL to cache */
  url: string
  /* The timestamp when the URL was cached */
  timestamp: number
}

/**
 * Simple cache for media URLs with expiration and size limits.
 */
class MediaCache {
  private readonly cache: Map<string, CacheEntry>
  private readonly maxSize: number
  private readonly maxAge: number // milliseconds

  constructor(maxSize = 1000, maxAgeMinutes = 30) {
    this.cache = new Map()
    this.maxSize = maxSize
    this.maxAge = maxAgeMinutes * 60 * 1000
  }

  /**
   * Get a URL from cache or cache it if not present.
   * @param url - The URL to cache
   * @returns The cached URL or null if invalid
   */
  get(url: string): string | null {
    try {
      // Validate URL
      new URL(url)

      const entry = this.cache.get(url)
      const now = Date.now()

      // If entry exists and hasn't expired
      if (entry && now - entry.timestamp < this.maxAge) {
        return entry.url
      }

      // Remove if expired
      if (entry) {
        this.cache.delete(url)
      }

      // Add new entry
      this.cache.set(url, { url, timestamp: now })
      this.cleanup()

      return url
    } catch (error) {
      console.warn('Invalid URL:', url, error)
      return null
    }
  }

  /**
   * Prefetch media content and cache the URL
   * @param url - The URL to prefetch
   * @returns Promise that resolves when prefetch is complete
   */
  async prefetch(url: string): Promise<void> {
    try {
      // Skip if already cached or invalid URL
      if (this.cache.has(url) || !this.get(url)) return

      // Create and append prefetch link
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = url
      document.head.appendChild(link)

      // Wait for prefetch to complete or timeout
      await Promise.race([
        new Promise((resolve) => {
          link.onload = resolve
          link.onerror = resolve // Still cache on error to prevent retries
        }),
        new Promise((resolve) => setTimeout(resolve, 5000)) // 5s timeout
      ])
    } catch (error) {
      console.warn('Prefetch failed:', url, error)
    }
  }

  /**
   * Remove expired entries and enforce size limit
   */
  private cleanup(): void {
    const now = Date.now()

    // Remove expired entries
    for (const [url, entry] of this.cache) {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(url)
      }
    }

    // Remove oldest entries if cache is too large
    if (this.cache.size > this.maxSize) {
      const entriesToRemove = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)
        .slice(0, this.cache.size - this.maxSize)

      for (const [url] of entriesToRemove) {
        this.cache.delete(url)
      }
    }
  }

  /**
   * Get current cache size
   */
  get size(): number {
    return this.cache.size
  }
}

// Create singleton instance
const mediaCache = new MediaCache()

// Export wrapped methods for simpler API
export const getCachedUrl = (url: string): string => mediaCache.get(url) ?? url
export const prefetchMedia = (url: string): Promise<void> =>
  mediaCache.prefetch(url)
