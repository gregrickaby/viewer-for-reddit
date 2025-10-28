import {describe, expect, it} from 'vitest'
import {
  createCommentsInfiniteConfig,
  extractCommentsListing
} from './commentsPagination'

describe('extractCommentsListing', () => {
  it('should extract listing from array response (index 1)', () => {
    const listing = {data: {children: [], after: 'abc123'}}
    const arrayResponse = [{}, listing]

    const result = extractCommentsListing(arrayResponse)

    expect(result).toBe(listing)
  })

  it('should return listing directly for non-array response', () => {
    const listing = {data: {children: [], after: 'def456'}}

    const result = extractCommentsListing(listing)

    expect(result).toBe(listing)
  })

  it('should handle empty listing data', () => {
    const listing = {data: undefined}

    const result = extractCommentsListing(listing)

    expect(result).toEqual({data: undefined})
  })

  it('should handle listing with no after token', () => {
    const listing = {data: {children: [], after: null}}

    const result = extractCommentsListing(listing)

    expect(result).toEqual({data: {children: [], after: null}})
  })
})

describe('createCommentsInfiniteConfig', () => {
  it('should create config with default maxPages of 10', () => {
    const config = createCommentsInfiniteConfig()

    expect(config).toMatchObject({
      initialPageParam: undefined,
      maxPages: 10
    })
    expect(config.getNextPageParam).toBeDefined()
    expect(config.getPreviousPageParam).toBeDefined()
  })

  it('should create config with custom maxPages', () => {
    const config = createCommentsInfiniteConfig(20)

    expect(config.maxPages).toBe(20)
  })

  it('should return undefined for getPreviousPageParam', () => {
    const config = createCommentsInfiniteConfig()

    const result = config.getPreviousPageParam()

    expect(result).toBeUndefined()
  })

  describe('getNextPageParam', () => {
    it('should extract after token from array response', () => {
      const config = createCommentsInfiniteConfig()
      const listing = {data: {children: [], after: 'page2'}}
      const arrayResponse = [{}, listing]

      const result = config.getNextPageParam(arrayResponse)

      expect(result).toBe('page2')
    })

    it('should extract after token from non-array response', () => {
      const config = createCommentsInfiniteConfig()
      const listing = {data: {children: [], after: 'page3'}}

      const result = config.getNextPageParam(listing)

      expect(result).toBe('page3')
    })

    it('should return undefined when after token is null', () => {
      const config = createCommentsInfiniteConfig()
      const listing = {data: {children: [], after: null}}

      const result = config.getNextPageParam(listing)

      expect(result).toBeUndefined()
    })

    it('should return undefined when after token is missing', () => {
      const config = createCommentsInfiniteConfig()
      const listing = {data: {children: []}}

      const result = config.getNextPageParam(listing)

      expect(result).toBeUndefined()
    })

    it('should return undefined when data is missing', () => {
      const config = createCommentsInfiniteConfig()
      const listing = {data: undefined}

      const result = config.getNextPageParam(listing)

      expect(result).toBeUndefined()
    })

    it('should handle empty string after token', () => {
      const config = createCommentsInfiniteConfig()
      const listing = {data: {children: [], after: ''}}

      const result = config.getNextPageParam(listing)

      expect(result).toBe('')
    })
  })
})
