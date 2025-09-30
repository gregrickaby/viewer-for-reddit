import type {AutoCommentData} from '@/lib/store/services/commentsApi'
import type {NestedCommentData} from '@/lib/utils/commentFilters'
import {
  getDisplayComments,
  getLoadingState,
  getNextPageControls,
  hasRequiredCommentFields,
  processInfiniteComments,
  processNestedComments
} from './commentHelpers'

// Mock the comment filters
vi.mock('./commentFilters', () => ({
  extractAndFilterComments: vi.fn(
    (children: any[]) =>
      children?.map((child: any) => child.data).filter(Boolean) || []
  ),
  extractNestedComments: vi.fn(
    (children: any[]) =>
      children?.map((child: any) => child.data).filter(Boolean) || []
  )
}))

describe('commentHelpers', () => {
  describe('hasRequiredCommentFields', () => {
    it('should return true for comment with required fields', () => {
      const comment: AutoCommentData = {
        id: 'test123',
        author: 'testuser',
        body: 'test comment',
        created_utc: 1234567890,
        ups: 10
      }

      expect(hasRequiredCommentFields(comment)).toBe(true)
    })

    it('should return true for comment with permalink instead of id', () => {
      const comment: AutoCommentData = {
        permalink: '/r/test/comments/test123',
        author: 'testuser',
        body_html: '<p>test comment</p>',
        created_utc: 1234567890,
        ups: 10
      }

      expect(hasRequiredCommentFields(comment)).toBe(true)
    })

    it('should return false for comment missing required fields', () => {
      const comment: AutoCommentData = {
        id: 'test123'
        // Missing author and body
      }

      expect(hasRequiredCommentFields(comment)).toBe(false)
    })

    it('should return false for null comment', () => {
      expect(hasRequiredCommentFields(null as any)).toBe(false)
    })
  })

  describe('getLoadingState', () => {
    it('should return raw loading state when nested comments enabled and infinite loading enabled', () => {
      const result = getLoadingState(
        true, // enableNestedComments
        true, // enableInfiniteLoading
        true, // isInfiniteLoadingRaw
        false, // isLoadingRaw
        false, // isInfiniteLoading
        false // isLoading
      )

      expect(result).toBe(true)
    })

    it('should return normal loading state when nested comments disabled and infinite loading enabled', () => {
      const result = getLoadingState(
        false, // enableNestedComments
        true, // enableInfiniteLoading
        false, // isInfiniteLoadingRaw
        false, // isLoadingRaw
        true, // isInfiniteLoading
        false // isLoading
      )

      expect(result).toBe(true)
    })

    it('should return simple loading state when neither infinite nor nested enabled', () => {
      const result = getLoadingState(
        false, // enableNestedComments
        false, // enableInfiniteLoading
        false, // isInfiniteLoadingRaw
        false, // isLoadingRaw
        false, // isInfiniteLoading
        true // isLoading
      )

      expect(result).toBe(true)
    })
  })

  describe('getNextPageControls', () => {
    const mockFetchNextPageRaw = () => {}
    const mockFetchNextPage = () => {}

    it('should return raw controls when nested comments enabled', () => {
      const result = getNextPageControls(
        true, // enableNestedComments
        mockFetchNextPageRaw,
        mockFetchNextPage,
        true, // hasNextPageRaw
        false, // hasNextPage
        true, // isFetchingNextPageRaw
        false // isFetchingNextPage
      )

      expect(result).toEqual({
        currentFetchNextPage: mockFetchNextPageRaw,
        currentHasNextPage: true,
        currentIsFetchingNextPage: true
      })
    })

    it('should return normal controls when nested comments disabled', () => {
      const result = getNextPageControls(
        false, // enableNestedComments
        mockFetchNextPageRaw,
        mockFetchNextPage,
        false, // hasNextPageRaw
        true, // hasNextPage
        false, // isFetchingNextPageRaw
        true // isFetchingNextPage
      )

      expect(result).toEqual({
        currentFetchNextPage: mockFetchNextPage,
        currentHasNextPage: true,
        currentIsFetchingNextPage: true
      })
    })
  })

  describe('getDisplayComments', () => {
    const mockNestedComments: NestedCommentData[] = [
      {id: 'nested1', depth: 0, hasReplies: false} as NestedCommentData
    ]
    const mockInfiniteComments: AutoCommentData[] = [
      {id: 'infinite1', author: 'user1'} as AutoCommentData
    ]
    const mockFlatComments: AutoCommentData[] = [
      {id: 'flat1', author: 'user2'} as AutoCommentData
    ]
    const mockProvidedComments: AutoCommentData[] = [
      {id: 'provided1', author: 'user3'} as AutoCommentData
    ]

    it('should return nested comments when nested mode enabled', () => {
      const result = getDisplayComments(
        true, // enableNestedComments
        mockNestedComments,
        mockInfiniteComments,
        mockFlatComments,
        mockProvidedComments
      )

      expect(result).toBe(mockNestedComments)
    })

    it('should return infinite comments when available and nested disabled', () => {
      const result = getDisplayComments(
        false, // enableNestedComments
        mockNestedComments,
        mockInfiniteComments,
        mockFlatComments,
        mockProvidedComments
      )

      expect(result).toBe(mockInfiniteComments)
    })

    it('should return flat comments when infinite comments empty', () => {
      const result = getDisplayComments(
        false, // enableNestedComments
        mockNestedComments,
        [], // empty infinite comments
        mockFlatComments,
        mockProvidedComments
      )

      expect(result).toBe(mockFlatComments)
    })

    it('should return provided comments as fallback', () => {
      const result = getDisplayComments(
        false, // enableNestedComments
        mockNestedComments,
        [], // empty infinite comments
        [], // empty flat comments
        mockProvidedComments
      )

      expect(result).toBe(mockProvidedComments)
    })

    it('should return empty array when no comments available', () => {
      const result = getDisplayComments(
        false, // enableNestedComments
        mockNestedComments,
        [], // empty infinite comments
        [] // empty flat comments
      )

      expect(result).toEqual([])
    })
  })

  describe('processInfiniteComments', () => {
    it('should return empty array for invalid infinite data', () => {
      expect(processInfiniteComments(null)).toEqual([])
      expect(processInfiniteComments({})).toEqual([])
      expect(processInfiniteComments({pages: []})).toEqual([])
    })

    it('should process infinite data pages correctly', () => {
      const mockInfiniteData = {
        pages: [
          [
            null, // post data
            {
              data: {
                children: [
                  {data: {id: 'comment1', author: 'user1', body: 'test1'}},
                  {data: {id: 'comment2', author: 'user2', body: 'test2'}}
                ]
              }
            }
          ]
        ]
      }

      const result = processInfiniteComments(mockInfiniteData)
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('comment1')
      expect(result[1].id).toBe('comment2')
    })
  })

  describe('processNestedComments', () => {
    const mockMapToNested = (comment: any, depth = 0): NestedCommentData => ({
      ...comment,
      depth,
      hasReplies: false,
      replies: undefined
    })

    it('should return empty array when nested comments disabled', () => {
      const result = processNestedComments(
        false, // enableNestedComments
        undefined,
        null,
        null,
        mockMapToNested
      )

      expect(result).toEqual([])
    })

    it('should process provided comments when available', () => {
      const providedComments = [
        {id: 'provided1', author: 'user1'} as AutoCommentData
      ]

      const result = processNestedComments(
        true, // enableNestedComments
        providedComments,
        null,
        null,
        mockMapToNested
      )

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('provided1')
      expect(result[0].depth).toBe(0)
    })

    it('should process infinite raw data when available', () => {
      const infiniteDataRaw = {
        pages: [
          [
            null,
            {
              data: {
                children: [
                  {data: {id: 'infinite1', author: 'user1', body: 'test'}}
                ]
              }
            }
          ]
        ]
      }

      const result = processNestedComments(
        true, // enableNestedComments
        undefined,
        infiniteDataRaw,
        null,
        mockMapToNested
      )

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('infinite1')
    })

    it('should process fetched raw data as fallback', () => {
      const fetchedCommentsRaw = [
        null,
        {
          data: {
            children: [{data: {id: 'fetched1', author: 'user1', body: 'test'}}]
          }
        }
      ]

      const result = processNestedComments(
        true, // enableNestedComments
        undefined,
        null,
        fetchedCommentsRaw,
        mockMapToNested
      )

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('fetched1')
    })

    it('should return empty array when no data available', () => {
      const result = processNestedComments(
        true, // enableNestedComments
        undefined,
        null,
        null,
        mockMapToNested
      )

      expect(result).toEqual([])
    })
  })
})
