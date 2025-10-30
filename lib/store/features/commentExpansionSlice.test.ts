import type {RootState} from '@/lib/store'
import {describe, expect, it} from 'vitest'
import commentExpansionReducer, {
  collapseAllComments,
  collapseComment,
  collapseSubtree,
  expandAllComments,
  expandComment,
  expandSubtree,
  resetExpansionState,
  selectExpandedCommentCount,
  selectIsCommentExpanded,
  selectIsSubtreeExpanded,
  toggleComment,
  toggleSubtree
} from './commentExpansionSlice'

describe('commentExpansionSlice', () => {
  const initialState = {
    expandedComments: {},
    expandedSubtrees: {}
  }

  describe('reducers', () => {
    it('should return initial state', () => {
      expect(commentExpansionReducer(undefined, {type: 'unknown'})).toEqual(
        initialState
      )
    })

    it('should toggle comment expansion from false to true', () => {
      const state = commentExpansionReducer(initialState, toggleComment('c1'))
      expect(state.expandedComments.c1).toBe(true)
    })

    it('should toggle comment expansion from true to false', () => {
      const previousState = {
        expandedComments: {c1: true},
        expandedSubtrees: {}
      }
      const state = commentExpansionReducer(previousState, toggleComment('c1'))
      expect(state.expandedComments.c1).toBe(false)
    })

    it('should toggle subtree expansion', () => {
      const state = commentExpansionReducer(initialState, toggleSubtree('c1'))
      expect(state.expandedSubtrees.c1).toBe(true)

      const state2 = commentExpansionReducer(state, toggleSubtree('c1'))
      expect(state2.expandedSubtrees.c1).toBe(false)
    })

    it('should expand a single comment', () => {
      const state = commentExpansionReducer(initialState, expandComment('c1'))
      expect(state.expandedComments.c1).toBe(true)
    })

    it('should collapse a single comment', () => {
      const previousState = {
        expandedComments: {c1: true},
        expandedSubtrees: {}
      }
      const state = commentExpansionReducer(
        previousState,
        collapseComment('c1')
      )
      expect(state.expandedComments.c1).toBe(false)
    })

    it('should expand all comments from array', () => {
      const state = commentExpansionReducer(
        initialState,
        expandAllComments(['c1', 'c2', 'c3'])
      )
      expect(state.expandedComments).toEqual({
        c1: true,
        c2: true,
        c3: true
      })
    })

    it('should expand subtree with parent and descendants', () => {
      const state = commentExpansionReducer(
        initialState,
        expandSubtree({id: 'c1', descendantIds: ['c2', 'c3', 'c4']})
      )
      expect(state.expandedSubtrees.c1).toBe(true)
      expect(state.expandedComments.c2).toBe(true)
      expect(state.expandedComments.c3).toBe(true)
      expect(state.expandedComments.c4).toBe(true)
    })

    it('should collapse subtree with parent and descendants', () => {
      const previousState = {
        expandedComments: {c2: true, c3: true, c4: true},
        expandedSubtrees: {c1: true}
      }
      const state = commentExpansionReducer(
        previousState,
        collapseSubtree({id: 'c1', descendantIds: ['c2', 'c3', 'c4']})
      )
      expect(state.expandedSubtrees.c1).toBe(false)
      expect(state.expandedComments.c2).toBe(false)
      expect(state.expandedComments.c3).toBe(false)
      expect(state.expandedComments.c4).toBe(false)
    })

    it('should collapse all comments', () => {
      const previousState = {
        expandedComments: {c1: true, c2: true, c3: true},
        expandedSubtrees: {c1: true, c2: true}
      }
      const state = commentExpansionReducer(
        previousState,
        collapseAllComments()
      )
      expect(state.expandedComments).toEqual({})
      expect(state.expandedSubtrees).toEqual({})
    })

    it('should reset to initial state', () => {
      const previousState = {
        expandedComments: {c1: true, c2: true},
        expandedSubtrees: {c1: true}
      }
      const state = commentExpansionReducer(
        previousState,
        resetExpansionState()
      )
      expect(state).toEqual(initialState)
    })

    it('should handle empty descendantIds array', () => {
      const state = commentExpansionReducer(
        initialState,
        expandSubtree({id: 'c1', descendantIds: []})
      )
      expect(state.expandedSubtrees.c1).toBe(true)
      expect(Object.keys(state.expandedComments)).toHaveLength(0)
    })

    it('should handle multiple toggles correctly', () => {
      let state = commentExpansionReducer(initialState, toggleComment('c1'))
      expect(state.expandedComments.c1).toBe(true)

      state = commentExpansionReducer(state, toggleComment('c2'))
      expect(state.expandedComments.c1).toBe(true)
      expect(state.expandedComments.c2).toBe(true)

      state = commentExpansionReducer(state, toggleComment('c1'))
      expect(state.expandedComments.c1).toBe(false)
      expect(state.expandedComments.c2).toBe(true)
    })
  })

  describe('selectors', () => {
    const mockState = {
      commentExpansion: {
        expandedComments: {c1: true, c2: false, c3: true},
        expandedSubtrees: {c1: true}
      }
    } as unknown as RootState

    it('should select if comment is expanded', () => {
      expect(selectIsCommentExpanded(mockState, 'c1')).toBe(true)
      expect(selectIsCommentExpanded(mockState, 'c2')).toBe(false)
      expect(selectIsCommentExpanded(mockState, 'c3')).toBe(true)
    })

    it('should return false for non-existent comment', () => {
      expect(selectIsCommentExpanded(mockState, 'c999')).toBe(false)
    })

    it('should select if subtree is expanded', () => {
      expect(selectIsSubtreeExpanded(mockState, 'c1')).toBe(true)
      expect(selectIsSubtreeExpanded(mockState, 'c2')).toBe(false)
    })

    it('should return false for non-existent subtree', () => {
      expect(selectIsSubtreeExpanded(mockState, 'c999')).toBe(false)
    })

    it('should count expanded comments correctly', () => {
      expect(selectExpandedCommentCount(mockState)).toBe(2)
    })

    it('should return 0 for empty expanded comments', () => {
      const emptyState = {
        commentExpansion: {
          expandedComments: {},
          expandedSubtrees: {}
        }
      } as unknown as RootState
      expect(selectExpandedCommentCount(emptyState)).toBe(0)
    })

    it('should not count false values in expanded comments', () => {
      const stateWithFalse = {
        commentExpansion: {
          expandedComments: {c1: true, c2: false, c3: false, c4: true},
          expandedSubtrees: {}
        }
      } as unknown as RootState
      expect(selectExpandedCommentCount(stateWithFalse)).toBe(2)
    })
  })
})
