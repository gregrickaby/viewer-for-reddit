'use client'

import type {NestedCommentData} from '@/lib/utils/commentFilters'
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from 'react'

interface CommentExpansionState {
  expandedComments: Set<string>
  expandedSubtrees: Set<string>
}

interface CommentExpansionContextValue {
  state: CommentExpansionState
  expandComment: (commentId: string) => void
  collapseComment: (commentId: string) => void
  expandCommentSubtree: (commentId: string, comment: NestedCommentData) => void
  collapseCommentSubtree: (
    commentId: string,
    comment: NestedCommentData
  ) => void
  toggleComment: (commentId: string) => void
  toggleCommentSubtree: (commentId: string, comment: NestedCommentData) => void
  isCommentExpanded: (commentId: string) => boolean
  isSubtreeExpanded: (commentId: string) => boolean
}

const CommentExpansionContext = createContext<
  CommentExpansionContextValue | undefined
>(undefined)

/**
 * Recursively collect all descendant comment IDs from a comment
 */
function collectDescendantIds(comment: NestedCommentData): string[] {
  const ids: string[] = []

  if (comment.replies && comment.replies.length > 0) {
    for (const reply of comment.replies) {
      if (reply.id) {
        ids.push(reply.id)
        // Recursively collect from nested replies
        ids.push(...collectDescendantIds(reply))
      }
    }
  }

  return ids
}

interface CommentExpansionProviderProps {
  children: ReactNode
}

export function CommentExpansionProvider({
  children
}: Readonly<CommentExpansionProviderProps>) {
  const [state, setState] = useState<CommentExpansionState>({
    expandedComments: new Set(),
    expandedSubtrees: new Set()
  })

  const expandComment = (commentId: string) => {
    setState((prev) => ({
      ...prev,
      expandedComments: new Set(prev.expandedComments).add(commentId)
    }))
  }

  const collapseComment = (commentId: string) => {
    setState((prev) => {
      const newExpandedComments = new Set(prev.expandedComments)
      const newExpandedSubtrees = new Set(prev.expandedSubtrees)
      newExpandedComments.delete(commentId)
      newExpandedSubtrees.delete(commentId)
      return {
        expandedComments: newExpandedComments,
        expandedSubtrees: newExpandedSubtrees
      }
    })
  }

  const expandCommentSubtree = (
    commentId: string,
    comment: NestedCommentData
  ) => {
    setState((prev) => {
      const newExpandedComments = new Set(prev.expandedComments)
      const newExpandedSubtrees = new Set(prev.expandedSubtrees)

      // Add the parent comment as expanded
      newExpandedComments.add(commentId)
      newExpandedSubtrees.add(commentId)

      // Add all descendant comment IDs as expanded
      const descendantIds = collectDescendantIds(comment)
      descendantIds.forEach((id) => {
        newExpandedComments.add(id)
      })

      return {
        expandedComments: newExpandedComments,
        expandedSubtrees: newExpandedSubtrees
      }
    })
  }

  const collapseCommentSubtree = (
    commentId: string,
    comment: NestedCommentData
  ) => {
    setState((prev) => {
      const newExpandedComments = new Set(prev.expandedComments)
      const newExpandedSubtrees = new Set(prev.expandedSubtrees)

      // Remove the parent comment
      newExpandedComments.delete(commentId)
      newExpandedSubtrees.delete(commentId)

      // Remove all descendant comment IDs
      const descendantIds = collectDescendantIds(comment)
      descendantIds.forEach((id) => {
        newExpandedComments.delete(id)
        newExpandedSubtrees.delete(id)
      })

      return {
        expandedComments: newExpandedComments,
        expandedSubtrees: newExpandedSubtrees
      }
    })
  }

  const toggleComment = (commentId: string) => {
    if (state.expandedComments.has(commentId)) {
      collapseComment(commentId)
    } else {
      expandComment(commentId)
    }
  }

  const toggleCommentSubtree = (
    commentId: string,
    comment: NestedCommentData
  ) => {
    if (state.expandedSubtrees.has(commentId)) {
      collapseCommentSubtree(commentId, comment)
    } else {
      expandCommentSubtree(commentId, comment)
    }
  }

  const isCommentExpanded = (commentId: string): boolean => {
    return state.expandedComments.has(commentId)
  }

  const isSubtreeExpanded = (commentId: string): boolean => {
    return state.expandedSubtrees.has(commentId)
  }

  const value: CommentExpansionContextValue = useMemo(
    () => ({
      state,
      expandComment,
      collapseComment,
      expandCommentSubtree,
      collapseCommentSubtree,
      toggleComment,
      toggleCommentSubtree,
      isCommentExpanded,
      isSubtreeExpanded
    }),
    [
      state,
      expandComment,
      collapseComment,
      expandCommentSubtree,
      collapseCommentSubtree,
      toggleComment,
      toggleCommentSubtree,
      isCommentExpanded,
      isSubtreeExpanded
    ]
  )

  return (
    <CommentExpansionContext.Provider value={value}>
      {children}
    </CommentExpansionContext.Provider>
  )
}

export function useCommentExpansion() {
  const context = useContext(CommentExpansionContext)
  if (context === undefined) {
    throw new Error(
      'useCommentExpansion must be used within a CommentExpansionProvider'
    )
  }
  return context
}
