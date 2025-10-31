import {createSelector, createSlice, type PayloadAction} from '@reduxjs/toolkit'
import type {RootState} from '../index'

interface CommentExpansionState {
  expandedComments: Record<string, boolean>
  expandedSubtrees: Record<string, boolean>
}

const initialState: CommentExpansionState = {
  expandedComments: {},
  expandedSubtrees: {}
}

export const commentExpansionSlice = createSlice({
  name: 'commentExpansion',
  initialState,
  reducers: {
    toggleComment: (state, action: PayloadAction<string>) => {
      const id = action.payload
      state.expandedComments[id] = !state.expandedComments[id]
    },
    toggleSubtree: (state, action: PayloadAction<string>) => {
      const id = action.payload
      state.expandedSubtrees[id] = !state.expandedSubtrees[id]
    },
    expandComment: (state, action: PayloadAction<string>) => {
      state.expandedComments[action.payload] = true
    },
    collapseComment: (state, action: PayloadAction<string>) => {
      state.expandedComments[action.payload] = false
    },
    expandAllComments: (state, action: PayloadAction<string[]>) => {
      for (const id of action.payload) {
        state.expandedComments[id] = true
      }
    },
    expandSubtree: (
      state,
      action: PayloadAction<{id: string; descendantIds: string[]}>
    ) => {
      const {id, descendantIds} = action.payload
      state.expandedSubtrees[id] = true
      for (const descendantId of descendantIds) {
        state.expandedComments[descendantId] = true
      }
    },
    collapseSubtree: (
      state,
      action: PayloadAction<{id: string; descendantIds: string[]}>
    ) => {
      const {id, descendantIds} = action.payload
      state.expandedSubtrees[id] = false
      for (const descendantId of descendantIds) {
        state.expandedComments[descendantId] = false
      }
    },
    collapseAllComments: (state) => {
      state.expandedComments = {}
      state.expandedSubtrees = {}
    },
    resetExpansionState: () => initialState
  }
})

export const {
  toggleComment,
  toggleSubtree,
  expandComment,
  collapseComment,
  expandAllComments,
  expandSubtree,
  collapseSubtree,
  collapseAllComments,
  resetExpansionState
} = commentExpansionSlice.actions

export const selectIsCommentExpanded = (
  state: RootState,
  commentId: string,
  depth?: number
): boolean => {
  const explicitState = state.commentExpansion.expandedComments[commentId]

  // If user has explicitly set state (true or false), use that
  if (explicitState !== undefined) {
    return explicitState
  }

  // Reddit-style defaults: top-level (0) and direct replies (1) expanded, deeper (2+) collapsed
  if (depth !== undefined) {
    return depth <= 1
  }

  // Fallback to collapsed if no depth provided
  return false
}

export const selectIsSubtreeExpanded = (state: RootState, commentId: string) =>
  state.commentExpansion.expandedSubtrees[commentId] ?? false

// Memoized selector for counting expanded comments
const selectExpandedCommentsObject = (state: RootState) =>
  state.commentExpansion.expandedComments

export const selectExpandedCommentCount = createSelector(
  [selectExpandedCommentsObject],
  (expandedComments) => Object.values(expandedComments).filter(Boolean).length
)

export default commentExpansionSlice.reducer
