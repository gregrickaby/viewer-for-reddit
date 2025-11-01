import type {AutoCommentData} from '@/lib/store/services/commentsApi'
import type {CommentSortingOption} from '@/lib/types'
import type {NestedCommentData} from '@/lib/utils/formatting/commentFilters'
import {
  collectAllCommentIds,
  collectDescendantIds,
  getDisplayComments,
  getLoadingState,
  getNextPageControls,
  hasRequiredCommentFields,
  processInfiniteComments,
  processNestedComments,
  sortComments
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
    const mockNestedComments: NestedCommentData[] = []
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

  describe('sortComments', () => {
    const mockAutoComments: AutoCommentData[] = [
      {ups: 100, created_utc: 1000, body: 'Comment 1'} as AutoCommentData,
      {ups: 50, created_utc: 3000, body: 'Comment 2'} as AutoCommentData,
      {ups: 200, created_utc: 2000, body: 'Comment 3'} as AutoCommentData,
      {ups: 10, created_utc: 4000, body: 'Comment 4'} as AutoCommentData
    ]

    const mockNestedComments: NestedCommentData[] = [
      {ups: 100, created_utc: 1000, depth: 0} as NestedCommentData,
      {ups: 50, created_utc: 3000, depth: 1} as NestedCommentData,
      {ups: 200, created_utc: 2000, depth: 0} as NestedCommentData,
      {ups: 10, created_utc: 4000, depth: 1} as NestedCommentData
    ]

    describe('best sorting', () => {
      it('should preserve original order for best sorting', () => {
        const result = sortComments(mockAutoComments, 'best')
        expect(result).toEqual(mockAutoComments)
        expect(result).toBe(mockAutoComments)
      })

      it('should preserve original order for nested comments', () => {
        const result = sortComments(mockNestedComments, 'best')
        expect(result).toEqual(mockNestedComments)
      })
    })

    describe('top sorting', () => {
      it('should sort by highest ups first', () => {
        const result = sortComments(mockAutoComments, 'top')
        expect(result[0].ups).toBe(200)
        expect(result[1].ups).toBe(100)
        expect(result[2].ups).toBe(50)
        expect(result[3].ups).toBe(10)
      })

      it('should sort nested comments by highest ups first', () => {
        const result = sortComments(mockNestedComments, 'top')
        expect(result[0].ups).toBe(200)
        expect(result[1].ups).toBe(100)
        expect(result[2].ups).toBe(50)
        expect(result[3].ups).toBe(10)
      })

      it('should handle missing ups values', () => {
        const commentsWithMissingUps: AutoCommentData[] = [
          {body: 'No ups'} as AutoCommentData,
          {ups: 50, body: 'Has ups'} as AutoCommentData
        ]
        const result = sortComments(commentsWithMissingUps, 'top')
        expect(result[0].ups).toBe(50)
        expect(result[1].ups).toBeUndefined()
      })
    })

    describe('new sorting', () => {
      it('should sort by most recent created_utc first', () => {
        const result = sortComments(mockAutoComments, 'new')
        expect(result[0].created_utc).toBe(4000)
        expect(result[1].created_utc).toBe(3000)
        expect(result[2].created_utc).toBe(2000)
        expect(result[3].created_utc).toBe(1000)
      })

      it('should sort nested comments by most recent first', () => {
        const result = sortComments(mockNestedComments, 'new')
        expect(result[0].created_utc).toBe(4000)
        expect(result[1].created_utc).toBe(3000)
        expect(result[2].created_utc).toBe(2000)
        expect(result[3].created_utc).toBe(1000)
      })

      it('should handle missing created_utc values', () => {
        const commentsWithMissingTime: AutoCommentData[] = [
          {body: 'No time'} as AutoCommentData,
          {created_utc: 5000, body: 'Has time'} as AutoCommentData
        ]
        const result = sortComments(commentsWithMissingTime, 'new')
        expect(result[0].created_utc).toBe(5000)
        expect(result[1].created_utc).toBeUndefined()
      })
    })

    describe('controversial sorting', () => {
      it('should sort by lowest ups first', () => {
        const result = sortComments(mockAutoComments, 'controversial')
        expect(result[0].ups).toBe(10)
        expect(result[1].ups).toBe(50)
        expect(result[2].ups).toBe(100)
        expect(result[3].ups).toBe(200)
      })

      it('should sort nested comments by lowest ups first', () => {
        const result = sortComments(mockNestedComments, 'controversial')
        expect(result[0].ups).toBe(10)
        expect(result[1].ups).toBe(50)
        expect(result[2].ups).toBe(100)
        expect(result[3].ups).toBe(200)
      })
    })

    describe('immutability', () => {
      it('should not mutate original array for top sorting', () => {
        const original = [...mockAutoComments]
        sortComments(mockAutoComments, 'top')
        expect(mockAutoComments).toEqual(original)
      })

      it('should not mutate original array for new sorting', () => {
        const original = [...mockAutoComments]
        sortComments(mockAutoComments, 'new')
        expect(mockAutoComments).toEqual(original)
      })

      it('should not mutate original array for controversial sorting', () => {
        const original = [...mockAutoComments]
        sortComments(mockAutoComments, 'controversial')
        expect(mockAutoComments).toEqual(original)
      })
    })

    describe('edge cases', () => {
      it('should handle empty arrays', () => {
        const result = sortComments([] as AutoCommentData[], 'top')
        expect(result).toEqual([])
      })

      it('should handle single comment', () => {
        const singleComment = [mockAutoComments[0]]
        const result = sortComments(singleComment, 'top')
        expect(result).toEqual(singleComment)
      })

      it('should handle invalid sort option gracefully', () => {
        const result = sortComments(
          mockAutoComments,
          'invalid' as CommentSortingOption
        )
        expect(result).toEqual(mockAutoComments)
      })
    })
  })

  describe('collectDescendantIds', () => {
    it('should collect all descendant IDs from nested comment tree', () => {
      const nestedComment: NestedCommentData = {
        id: 'parent',
        author: 'user1',
        body: 'Parent',
        created_utc: 100,
        ups: 10,
        depth: 0,
        replies: [
          {
            id: 'child1',
            author: 'user2',
            body: 'Child 1',
            created_utc: 101,
            ups: 5,
            depth: 1,
            replies: [
              {
                id: 'grandchild1',
                author: 'user3',
                body: 'Grandchild 1',
                created_utc: 102,
                ups: 3,
                depth: 2
              }
            ]
          },
          {
            id: 'child2',
            author: 'user4',
            body: 'Child 2',
            created_utc: 103,
            ups: 4,
            depth: 1
          }
        ]
      }

      const result = collectDescendantIds(nestedComment)
      expect(result).toEqual(['child1', 'grandchild1', 'child2'])
    })

    it('should handle comment without replies', () => {
      const comment: NestedCommentData = {
        id: 'alone',
        author: 'user',
        body: 'No replies',
        created_utc: 100,
        ups: 1,
        depth: 0
      }

      const result = collectDescendantIds(comment)
      expect(result).toEqual([])
    })

    it('should handle comment with empty replies array', () => {
      const comment: NestedCommentData = {
        id: 'empty',
        author: 'user',
        body: 'Empty replies',
        created_utc: 100,
        ups: 1,
        depth: 0,
        replies: []
      }

      const result = collectDescendantIds(comment)
      expect(result).toEqual([])
    })
  })

  describe('collectAllCommentIds', () => {
    it('should collect all IDs from flat comment array', () => {
      const comments: NestedCommentData[] = [
        {
          id: 'comment1',
          author: 'user1',
          body: 'Comment 1',
          created_utc: 100,
          ups: 10,
          depth: 0
        },
        {
          id: 'comment2',
          author: 'user2',
          body: 'Comment 2',
          created_utc: 101,
          ups: 5,
          depth: 0
        }
      ]

      const result = collectAllCommentIds(comments)
      expect(result).toEqual(['comment1', 'comment2'])
    })

    it('should collect all IDs from nested comment array', () => {
      const comments: NestedCommentData[] = [
        {
          id: 'parent1',
          author: 'user1',
          body: 'Parent 1',
          created_utc: 100,
          ups: 10,
          depth: 0,
          replies: [
            {
              id: 'child1',
              author: 'user2',
              body: 'Child 1',
              created_utc: 101,
              ups: 5,
              depth: 1
            }
          ]
        },
        {
          id: 'parent2',
          author: 'user3',
          body: 'Parent 2',
          created_utc: 102,
          ups: 8,
          depth: 0
        }
      ]

      const result = collectAllCommentIds(comments)
      expect(result).toEqual(['parent1', 'child1', 'parent2'])
    })

    it('should handle empty array', () => {
      const result = collectAllCommentIds([])
      expect(result).toEqual([])
    })

    it('should handle deeply nested comments', () => {
      const comments: NestedCommentData[] = [
        {
          id: 'level0',
          author: 'user1',
          body: 'Level 0',
          created_utc: 100,
          ups: 10,
          depth: 0,
          replies: [
            {
              id: 'level1',
              author: 'user2',
              body: 'Level 1',
              created_utc: 101,
              ups: 5,
              depth: 1,
              replies: [
                {
                  id: 'level2',
                  author: 'user3',
                  body: 'Level 2',
                  created_utc: 102,
                  ups: 3,
                  depth: 2
                }
              ]
            }
          ]
        }
      ]

      const result = collectAllCommentIds(comments)
      expect(result).toEqual(['level0', 'level1', 'level2'])
    })
  })
})
