import {act, renderHook} from '@/test-utils'
import {useCommentNavigation} from './useCommentNavigation'

function createMockComment(id: string, depth: number): HTMLElement {
  const div = document.createElement('div')
  div.dataset.commentId = id
  div.dataset.commentDepth = depth.toString()
  div.tabIndex = -1
  return div
}

describe('useCommentNavigation', () => {
  let mockComments: HTMLElement[]

  beforeEach(() => {
    mockComments = [
      createMockComment('comment1', 0),
      createMockComment('comment2', 1),
      createMockComment('comment3', 1),
      createMockComment('comment4', 0),
      createMockComment('comment5', 1)
    ]

    for (const comment of mockComments) {
      document.body.appendChild(comment)
    }
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const {result} = renderHook(() => useCommentNavigation())

      expect(result.current.currentFocusIndex).toBe(-1)
      expect(result.current.announcementText).toBe('')
    })
  })

  describe('Manual Navigation API', () => {
    it('should focus comment by index via handleCommentFocus', () => {
      const {result} = renderHook(() => useCommentNavigation())

      act(() => {
        result.current.handleCommentFocus(2)
      })

      expect(result.current.currentFocusIndex).toBe(2)
      expect(mockComments[2]).toHaveFocus()
    })

    it('should announce navigation when enabled', () => {
      const {result} = renderHook(() =>
        useCommentNavigation({announceNavigation: true})
      )

      act(() => {
        result.current.handleCommentFocus(0)
      })

      expect(result.current.announcementText).toMatch(/Comment 1 of 5/)
      expect(result.current.announcementText).toMatch(/depth 0/)
    })

    it('should not announce navigation when disabled', () => {
      const {result} = renderHook(() =>
        useCommentNavigation({announceNavigation: false})
      )

      act(() => {
        result.current.handleCommentFocus(0)
      })

      expect(result.current.currentFocusIndex).toBe(0)
      expect(result.current.announcementText).toBe('')
    })

    it('should clear announcement text', () => {
      const {result} = renderHook(() => useCommentNavigation())

      act(() => {
        result.current.handleCommentFocus(0)
      })

      expect(result.current.announcementText).toBeTruthy()

      act(() => {
        result.current.clearAnnouncement()
      })

      expect(result.current.announcementText).toBe('')
    })

    it('should not focus invalid negative index', () => {
      const {result} = renderHook(() => useCommentNavigation())

      act(() => {
        result.current.handleCommentFocus(-1)
      })

      expect(result.current.currentFocusIndex).toBe(-1)
    })

    it('should not focus invalid index beyond array bounds', () => {
      const {result} = renderHook(() => useCommentNavigation())

      act(() => {
        result.current.handleCommentFocus(999)
      })

      expect(result.current.currentFocusIndex).toBe(-1)
    })
  })

  describe('Navigation through Comment Hierarchy', () => {
    it('should handle nested comment hierarchy', () => {
      document.body.innerHTML = ''
      const nestedComments = [
        createMockComment('root1', 0),
        createMockComment('child1', 1),
        createMockComment('grandchild1', 2),
        createMockComment('root2', 0)
      ]

      for (const comment of nestedComments) {
        document.body.appendChild(comment)
      }

      const {result} = renderHook(() => useCommentNavigation())

      // Focus grandchild (depth 2)
      act(() => {
        result.current.handleCommentFocus(2)
      })

      expect(result.current.currentFocusIndex).toBe(2)
      expect(nestedComments[2]).toHaveFocus()
    })

    it('should handle empty comment list gracefully', () => {
      document.body.innerHTML = ''
      const {result} = renderHook(() => useCommentNavigation())

      act(() => {
        result.current.handleCommentFocus(0)
      })

      expect(result.current.currentFocusIndex).toBe(-1)
    })
  })

  describe('Options', () => {
    it('should allow manual focus regardless of enabled state', () => {
      const {result: enabledResult} = renderHook(() =>
        useCommentNavigation({enabled: true})
      )
      const {result: disabledResult} = renderHook(() =>
        useCommentNavigation({enabled: false})
      )

      // Enabled should work
      act(() => {
        enabledResult.current.handleCommentFocus(0)
      })

      expect(enabledResult.current.currentFocusIndex).toBe(0)

      // Disabled doesn't update element list, so manual focus won't work
      act(() => {
        disabledResult.current.handleCommentFocus(0)
      })

      expect(disabledResult.current.currentFocusIndex).toBe(-1)
    })
  })
})
