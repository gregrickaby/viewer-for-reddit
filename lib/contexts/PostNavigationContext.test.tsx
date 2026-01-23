import {renderHook} from '@/test-utils'
import {act} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import {
  PostNavigationProvider,
  usePostNavigation
} from './PostNavigationContext'

describe('PostNavigationContext', () => {
  const mockPosts = [
    {id: 't3_post1', url: '/r/test/comments/post1/title1', title: 'Post 1'},
    {id: 't3_post2', url: '/r/test/comments/post2/title2', title: 'Post 2'},
    {id: 't3_post3', url: '/r/test/comments/post3/title3', title: 'Post 3'}
  ]

  describe('provider', () => {
    it('provides context value', () => {
      const {result} = renderHook(() => usePostNavigation(), {
        wrapper: PostNavigationProvider
      })

      expect(result.current.posts).toEqual([])
      expect(result.current.currentPostId).toBeNull()
      expect(typeof result.current.setPosts).toBe('function')
      expect(typeof result.current.setCurrentPostId).toBe('function')
      expect(typeof result.current.getNextPost).toBe('function')
      expect(typeof result.current.getPreviousPost).toBe('function')
    })

    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error
      console.error = () => {}

      expect(() => {
        renderHook(() => usePostNavigation())
      }).toThrow('usePostNavigation must be used within PostNavigationProvider')

      console.error = originalError
    })
  })

  describe('setPosts', () => {
    it('updates posts array', () => {
      const {result} = renderHook(() => usePostNavigation(), {
        wrapper: PostNavigationProvider
      })

      act(() => {
        result.current.setPosts(mockPosts)
      })

      expect(result.current.posts).toEqual(mockPosts)
    })

    it('replaces previous posts', () => {
      const {result} = renderHook(() => usePostNavigation(), {
        wrapper: PostNavigationProvider
      })

      act(() => {
        result.current.setPosts(mockPosts)
      })

      const newPosts = [
        {id: 't3_new1', url: '/r/new/comments/new1/title', title: 'New 1'}
      ]

      act(() => {
        result.current.setPosts(newPosts)
      })

      expect(result.current.posts).toEqual(newPosts)
    })
  })

  describe('setCurrentPostId', () => {
    it('updates current post ID', () => {
      const {result} = renderHook(() => usePostNavigation(), {
        wrapper: PostNavigationProvider
      })

      act(() => {
        result.current.setCurrentPostId('t3_post1')
      })

      expect(result.current.currentPostId).toBe('t3_post1')
    })

    it('can set to null', () => {
      const {result} = renderHook(() => usePostNavigation(), {
        wrapper: PostNavigationProvider
      })

      act(() => {
        result.current.setCurrentPostId('t3_post1')
      })

      act(() => {
        result.current.setCurrentPostId(null)
      })

      expect(result.current.currentPostId).toBeNull()
    })
  })

  describe('getNextPost', () => {
    it('returns next post when available', () => {
      const {result} = renderHook(() => usePostNavigation(), {
        wrapper: PostNavigationProvider
      })

      act(() => {
        result.current.setPosts(mockPosts)
        result.current.setCurrentPostId('t3_post1')
      })

      const nextPost = result.current.getNextPost()
      expect(nextPost).toEqual(mockPosts[1])
    })

    it('returns null when at last post', () => {
      const {result} = renderHook(() => usePostNavigation(), {
        wrapper: PostNavigationProvider
      })

      act(() => {
        result.current.setPosts(mockPosts)
        result.current.setCurrentPostId('t3_post3')
      })

      const nextPost = result.current.getNextPost()
      expect(nextPost).toBeNull()
    })

    it('returns null when no current post', () => {
      const {result} = renderHook(() => usePostNavigation(), {
        wrapper: PostNavigationProvider
      })

      act(() => {
        result.current.setPosts(mockPosts)
      })

      const nextPost = result.current.getNextPost()
      expect(nextPost).toBeNull()
    })

    it('returns null when posts array is empty', () => {
      const {result} = renderHook(() => usePostNavigation(), {
        wrapper: PostNavigationProvider
      })

      act(() => {
        result.current.setCurrentPostId('t3_post1')
      })

      const nextPost = result.current.getNextPost()
      expect(nextPost).toBeNull()
    })

    it('returns null when current post not found in array', () => {
      const {result} = renderHook(() => usePostNavigation(), {
        wrapper: PostNavigationProvider
      })

      act(() => {
        result.current.setPosts(mockPosts)
        result.current.setCurrentPostId('t3_unknown')
      })

      const nextPost = result.current.getNextPost()
      expect(nextPost).toBeNull()
    })
  })

  describe('getPreviousPost', () => {
    it('returns previous post when available', () => {
      const {result} = renderHook(() => usePostNavigation(), {
        wrapper: PostNavigationProvider
      })

      act(() => {
        result.current.setPosts(mockPosts)
        result.current.setCurrentPostId('t3_post2')
      })

      const previousPost = result.current.getPreviousPost()
      expect(previousPost).toEqual(mockPosts[0])
    })

    it('returns null when at first post', () => {
      const {result} = renderHook(() => usePostNavigation(), {
        wrapper: PostNavigationProvider
      })

      act(() => {
        result.current.setPosts(mockPosts)
        result.current.setCurrentPostId('t3_post1')
      })

      const previousPost = result.current.getPreviousPost()
      expect(previousPost).toBeNull()
    })

    it('returns null when no current post', () => {
      const {result} = renderHook(() => usePostNavigation(), {
        wrapper: PostNavigationProvider
      })

      act(() => {
        result.current.setPosts(mockPosts)
      })

      const previousPost = result.current.getPreviousPost()
      expect(previousPost).toBeNull()
    })

    it('returns null when posts array is empty', () => {
      const {result} = renderHook(() => usePostNavigation(), {
        wrapper: PostNavigationProvider
      })

      act(() => {
        result.current.setCurrentPostId('t3_post1')
      })

      const previousPost = result.current.getPreviousPost()
      expect(previousPost).toBeNull()
    })

    it('returns null when current post not found in array', () => {
      const {result} = renderHook(() => usePostNavigation(), {
        wrapper: PostNavigationProvider
      })

      act(() => {
        result.current.setPosts(mockPosts)
        result.current.setCurrentPostId('t3_unknown')
      })

      const previousPost = result.current.getPreviousPost()
      expect(previousPost).toBeNull()
    })
  })

  describe('navigation through list', () => {
    it('navigates forward through all posts', () => {
      const {result} = renderHook(() => usePostNavigation(), {
        wrapper: PostNavigationProvider
      })

      act(() => {
        result.current.setPosts(mockPosts)
        result.current.setCurrentPostId('t3_post1')
      })

      // First -> Second
      expect(result.current.getNextPost()).toEqual(mockPosts[1])

      act(() => {
        result.current.setCurrentPostId('t3_post2')
      })

      // Second -> Third
      expect(result.current.getNextPost()).toEqual(mockPosts[2])

      act(() => {
        result.current.setCurrentPostId('t3_post3')
      })

      // Third -> null (end)
      expect(result.current.getNextPost()).toBeNull()
    })

    it('navigates backward through all posts', () => {
      const {result} = renderHook(() => usePostNavigation(), {
        wrapper: PostNavigationProvider
      })

      act(() => {
        result.current.setPosts(mockPosts)
        result.current.setCurrentPostId('t3_post3')
      })

      // Third -> Second
      expect(result.current.getPreviousPost()).toEqual(mockPosts[1])

      act(() => {
        result.current.setCurrentPostId('t3_post2')
      })

      // Second -> First
      expect(result.current.getPreviousPost()).toEqual(mockPosts[0])

      act(() => {
        result.current.setCurrentPostId('t3_post1')
      })

      // First -> null (beginning)
      expect(result.current.getPreviousPost()).toBeNull()
    })
  })
})
