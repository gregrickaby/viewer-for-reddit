import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import type {RootState} from '@/lib/store'

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

export const selectIsCommentExpanded = (state: RootState, commentId: string) =>
  state.commentExpansion.expandedComments[commentId] ?? false

export const selectIsSubtreeExpanded = (state: RootState, commentId: string) =>
  state.commentExpansion.expandedSubtrees[commentId] ?? false

export const selectExpandedCommentCount = (state: RootState) =>
  Object.values(state.commentExpansion.expandedComments).filter(Boolean).length

export default commentExpansionSlice.reducer
