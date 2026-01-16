import {describe, expect, it} from 'vitest'
import {
  BOSS_BUTTON_DELAY,
  DEFAULT_POST_LIMIT,
  FIVE_MINUTES,
  ONE_HOUR,
  REDDIT_API_URL,
  REDDIT_PUBLIC_API_URL,
  SCROLL_THRESHOLD,
  TEN_MINUTES
} from './constants'

describe('constants', () => {
  describe('cache revalidation times', () => {
    it('defines FIVE_MINUTES as 300 seconds', () => {
      expect(FIVE_MINUTES).toBe(300)
    })

    it('defines TEN_MINUTES as 600 seconds', () => {
      expect(TEN_MINUTES).toBe(600)
    })

    it('defines ONE_HOUR as 3600 seconds', () => {
      expect(ONE_HOUR).toBe(3600)
    })

    it('validates time relationships', () => {
      expect(TEN_MINUTES).toBe(FIVE_MINUTES * 2)
      expect(ONE_HOUR).toBe(FIVE_MINUTES * 12)
      expect(ONE_HOUR).toBe(TEN_MINUTES * 6)
    })
  })

  describe('Reddit API configuration', () => {
    it('defines REDDIT_API_URL for OAuth', () => {
      expect(REDDIT_API_URL).toBe('https://oauth.reddit.com')
    })

    it('defines REDDIT_PUBLIC_API_URL for public access', () => {
      expect(REDDIT_PUBLIC_API_URL).toBe('https://www.reddit.com')
    })

    it('uses HTTPS for all API URLs', () => {
      expect(REDDIT_API_URL).toMatch(/^https:\/\//)
      expect(REDDIT_PUBLIC_API_URL).toMatch(/^https:\/\//)
    })
  })

  describe('pagination', () => {
    it('defines DEFAULT_POST_LIMIT as 25', () => {
      expect(DEFAULT_POST_LIMIT).toBe(25)
    })

    it('validates DEFAULT_POST_LIMIT is within Reddit limits', () => {
      expect(DEFAULT_POST_LIMIT).toBeGreaterThan(0)
      expect(DEFAULT_POST_LIMIT).toBeLessThanOrEqual(100)
    })
  })

  describe('UI thresholds', () => {
    it('defines SCROLL_THRESHOLD as 100 pixels', () => {
      expect(SCROLL_THRESHOLD).toBe(100)
    })

    it('defines BOSS_BUTTON_DELAY as 200 milliseconds', () => {
      expect(BOSS_BUTTON_DELAY).toBe(200)
    })

    it('validates UI thresholds are positive numbers', () => {
      expect(SCROLL_THRESHOLD).toBeGreaterThan(0)
      expect(BOSS_BUTTON_DELAY).toBeGreaterThan(0)
    })
  })
})
