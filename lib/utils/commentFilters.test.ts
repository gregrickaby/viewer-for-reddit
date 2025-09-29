import {
  COMMENT_CONTENT_MARKERS,
  extractAndFilterComments,
  extractNestedComments,
  filterValidComments,
  flattenComments,
  isAutoModeratorComment,
  isValidComment,
  type NestedCommentData
} from './commentFilters'

const mockValidComment = {
  author: 'user123',
  body: 'This is a valid comment',
  body_html: '<p>This is a valid comment</p>'
} as any

const mockDeletedComment = {
  author: COMMENT_CONTENT_MARKERS.DELETED,
  body: COMMENT_CONTENT_MARKERS.DELETED,
  body_html: ''
} as any

const mockRemovedComment = {
  author: COMMENT_CONTENT_MARKERS.REMOVED,
  body: COMMENT_CONTENT_MARKERS.REMOVED,
  body_html: ''
} as any

const mockAutoModComment = {
  author: COMMENT_CONTENT_MARKERS.AUTO_MODERATOR,
  body: 'This is an AutoModerator comment',
  body_html: '<p>This is an AutoModerator comment</p>'
} as any

const mockEmptyComment = {
  author: 'user123',
  body: '',
  body_html: ''
} as any

describe('commentFilters', () => {
  describe('isAutoModeratorComment', () => {
    it('should return true for AutoModerator comments', () => {
      expect(isAutoModeratorComment(mockAutoModComment)).toBe(true)
    })

    it('should return false for regular user comments', () => {
      expect(isAutoModeratorComment(mockValidComment)).toBe(false)
    })
  })

  describe('isValidComment', () => {
    it('should return true for valid comments', () => {
      expect(isValidComment(mockValidComment)).toBe(true)
    })

    it('should return false for deleted comments', () => {
      expect(isValidComment(mockDeletedComment)).toBe(false)
    })

    it('should return false for removed comments', () => {
      expect(isValidComment(mockRemovedComment)).toBe(false)
    })

    it('should return false for empty comments', () => {
      expect(isValidComment(mockEmptyComment)).toBe(false)
    })

    it('should return true for comments with only HTML body', () => {
      const htmlOnlyComment = {
        author: 'user123',
        body: '',
        body_html: '<p>Valid HTML content</p>'
      } as any
      expect(isValidComment(htmlOnlyComment)).toBe(true)
    })
  })

  describe('filterValidComments', () => {
    it('should filter out AutoModerator and invalid comments', () => {
      const comments = [
        mockValidComment,
        mockAutoModComment,
        mockDeletedComment,
        mockRemovedComment,
        mockEmptyComment
      ]

      const filtered = filterValidComments(comments)
      expect(filtered).toHaveLength(1)
      expect(filtered[0]).toBe(mockValidComment)
    })

    it('should return empty array for all invalid comments', () => {
      const comments = [
        mockAutoModComment,
        mockDeletedComment,
        mockRemovedComment
      ]
      const filtered = filterValidComments(comments)
      expect(filtered).toHaveLength(0)
    })

    it('should preserve all valid comments', () => {
      const validComment2 = {
        author: 'user456',
        body: 'Another valid comment',
        body_html: '<p>Another valid comment</p>'
      } as any

      const comments = [mockValidComment, validComment2]
      const filtered = filterValidComments(comments)
      expect(filtered).toHaveLength(2)
      expect(filtered).toEqual([mockValidComment, validComment2])
    })
  })

  describe('extractAndFilterComments', () => {
    it('should extract and filter comment data from children array', () => {
      const children = [
        {data: mockValidComment},
        {data: mockAutoModComment},
        {data: mockDeletedComment},
        {data: null}, // Should be filtered out
        {data: undefined} // Should be filtered out
      ]

      const result = extractAndFilterComments(children)
      expect(result).toHaveLength(1)
      expect(result[0]).toBe(mockValidComment)
    })

    it('should handle empty children array', () => {
      const result = extractAndFilterComments([])
      expect(result).toHaveLength(0)
    })

    it('should handle children with no data property', () => {
      const children = [{}, {data: mockValidComment}]
      const result = extractAndFilterComments(children)
      expect(result).toHaveLength(1)
      expect(result[0]).toBe(mockValidComment)
    })
  })

  describe('extractNestedComments', () => {
    const mockCommentWithReplies = {
      id: 'comment1',
      author: 'user123',
      body: 'Parent comment',
      body_html: '<p>Parent comment</p>',
      replies: {
        data: {
          children: [
            {
              data: {
                id: 'reply1',
                author: 'user456',
                body: 'First reply',
                body_html: '<p>First reply</p>',
                replies: {
                  data: {
                    children: [
                      {
                        data: {
                          id: 'nestedReply1',
                          author: 'user789',
                          body: 'Nested reply',
                          body_html: '<p>Nested reply</p>'
                        }
                      }
                    ]
                  }
                }
              }
            }
          ]
        }
      }
    }

    it('should extract nested comment structure with depth information', () => {
      const children = [{data: mockCommentWithReplies}]
      const result = extractNestedComments(children)

      expect(result).toHaveLength(1)
      expect(result[0].depth).toBe(0)
      expect(result[0].hasReplies).toBe(true)
      expect(result[0].replies).toHaveLength(1)
      expect(result[0].replies![0].depth).toBe(1)
      expect(result[0].replies![0].hasReplies).toBe(true)
      expect(result[0].replies![0].replies![0].depth).toBe(2)
    })

    it('should handle comments with no replies', () => {
      const children = [{data: mockValidComment}]
      const result = extractNestedComments(children)

      expect(result).toHaveLength(1)
      expect(result[0].depth).toBe(0)
      expect(result[0].hasReplies).toBe(false)
      expect(result[0].replies).toBeUndefined()
    })

    it('should filter out invalid comments and AutoModerator comments', () => {
      const children = [
        {data: mockValidComment},
        {data: mockAutoModComment},
        {data: mockDeletedComment}
      ]
      const result = extractNestedComments(children)

      expect(result).toHaveLength(1)
      expect(result[0].author).toBe('user123')
    })

    it('should handle empty or invalid children array', () => {
      expect(extractNestedComments([])).toHaveLength(0)
      expect(extractNestedComments(null as any)).toHaveLength(0)
      expect(extractNestedComments(undefined as any)).toHaveLength(0)
    })
  })

  describe('flattenComments', () => {
    const mockNestedComments: NestedCommentData[] = [
      {
        id: 'comment1',
        author: 'user123',
        body: 'Parent comment',
        body_html: '<p>Parent comment</p>',
        depth: 0,
        hasReplies: true,
        replies: [
          {
            id: 'reply1',
            author: 'user456',
            body: 'First reply',
            body_html: '<p>First reply</p>',
            depth: 1,
            hasReplies: true,
            replies: [
              {
                id: 'nestedReply1',
                author: 'user789',
                body: 'Nested reply',
                body_html: '<p>Nested reply</p>',
                depth: 2,
                hasReplies: false
              } as NestedCommentData
            ]
          } as NestedCommentData
        ]
      } as NestedCommentData
    ]

    it('should flatten nested comments while preserving depth', () => {
      const result = flattenComments(mockNestedComments)

      expect(result).toHaveLength(3)
      expect(result[0].depth).toBe(0)
      expect(result[0].author).toBe('user123')
      expect(result[1].depth).toBe(1)
      expect(result[1].author).toBe('user456')
      expect(result[2].depth).toBe(2)
      expect(result[2].author).toBe('user789')
    })

    it('should respect maxDepth limit', () => {
      const result = flattenComments(mockNestedComments, 1)

      expect(result).toHaveLength(2) // Only depth 0 and 1
      expect(result[0].depth).toBe(0)
      expect(result[1].depth).toBe(1)
    })

    it('should handle empty nested comments array', () => {
      const result = flattenComments([])
      expect(result).toHaveLength(0)
    })
  })
})
