import {render, screen} from '@/test-utils'
import {FeedContainer} from '@/components/layout/FeedContainer/FeedContainer'
import {CommentListSkeleton} from '@/components/skeletons/CommentSkeleton/CommentSkeleton'
import {PostSkeleton} from '@/components/skeletons/PostSkeleton/PostSkeleton'
import {DirectionalTransition} from '@/components/ui/DirectionalTransition/DirectionalTransition'
import {DynamicMetadataMarker} from '@/components/ui/DynamicMetadataMarker/DynamicMetadataMarker'
import {fetchPost} from '@/lib/actions/reddit/posts'
import type {RedditComment, RedditPost} from '@/lib/types/reddit'
import {generatePostMetadata} from '@/lib/utils/metadata-helpers'
import {Title} from '@mantine/core'
import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {Suspense, ViewTransition, type ReactElement} from 'react'
import {describe, expect, it, vi} from 'vitest'

vi.mock('@/lib/actions/reddit/posts', () => ({
  fetchPost: vi.fn()
}))

vi.mock('@/lib/utils/metadata-helpers', () => ({
  generatePostMetadata: vi.fn()
}))

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  })
}))

// Mock child components.
vi.mock('@/components/ui/RecordRecentPost/RecordRecentPost', () => ({
  RecordRecentPost: ({post}: {post: RedditPost}) => (
    <div data-testid="record-recent-post">{post.id}</div>
  )
}))

vi.mock('@/components/ui/PostCard/PostCard', () => ({
  PostCard: ({post}: {post: RedditPost}) => (
    <div data-testid="post-card">{post.title}</div>
  )
}))

vi.mock('@/components/ui/CommentListWithTabs/CommentListWithTabs', () => ({
  CommentListWithTabs: ({
    comments,
    activeSort
  }: {
    comments: RedditComment[]
    activeSort: string
  }) => (
    <div data-testid="comment-list" data-active-sort={activeSort}>
      {comments.length}
    </div>
  )
}))

import {
  CommentList,
  generatePostThreadMetadata,
  PostDetail,
  PostThread
} from './PostThread'

const mockFetchPost = vi.mocked(fetchPost)

const mockPost = {
  id: 'abc123',
  title: 'A great post',
  subreddit: 'reactjs',
  author: 'testuser',
  selftext: 'Body text'
} as unknown as RedditPost

describe('generatePostThreadMetadata', () => {
  const params = Promise.resolve({
    subreddit: 'reactjs',
    postId: 'abc123',
    slug: 'a-great-post'
  })

  it('returns metadata built from the fetched post when it exists', async () => {
    mockFetchPost.mockResolvedValue({post: mockPost, comments: []})
    const mockMetadata = {title: 'A great post'} as Metadata
    vi.mocked(generatePostMetadata).mockReturnValue(mockMetadata)

    const result = await generatePostThreadMetadata(params)

    expect(generatePostMetadata).toHaveBeenCalledWith(
      mockPost,
      '/r/reactjs/comments/abc123/a-great-post'
    )
    expect(result).toBe(mockMetadata)
    expect(notFound).not.toHaveBeenCalled()
  })

  it('calls notFound when the post does not exist', async () => {
    mockFetchPost.mockResolvedValue({
      post: undefined as unknown as RedditPost,
      comments: []
    })

    await expect(generatePostThreadMetadata(params)).rejects.toThrow(
      'NEXT_NOT_FOUND'
    )

    expect(notFound).toHaveBeenCalledTimes(1)
    expect(generatePostMetadata).not.toHaveBeenCalled()
  })
})

describe('PostDetail', () => {
  const params = Promise.resolve({
    subreddit: 'reactjs',
    postId: 'abc123',
    slug: 'a-great-post'
  })

  it('renders RecordRecentPost and PostCard when the post exists', async () => {
    mockFetchPost.mockResolvedValue({post: mockPost, comments: []})

    render(await PostDetail({params}))

    expect(mockFetchPost).toHaveBeenCalledWith('reactjs', 'abc123')
    expect(screen.getByTestId('record-recent-post')).toHaveTextContent('abc123')
    expect(screen.getByTestId('post-card')).toHaveTextContent('A great post')
  })

  it('calls notFound when the post does not exist', async () => {
    mockFetchPost.mockResolvedValue({
      post: undefined as unknown as RedditPost,
      comments: []
    })

    await expect(PostDetail({params})).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalledTimes(1)
  })
})

describe('CommentList', () => {
  const mockComments = [{id: 'c1'}, {id: 'c2'}] as unknown as RedditComment[]

  it('defaults to "best" sort and fetches without a comment focus', async () => {
    mockFetchPost.mockResolvedValue({post: mockPost, comments: mockComments})
    const params = Promise.resolve({
      subreddit: 'reactjs',
      postId: 'abc123',
      slug: 'a-great-post'
    })
    const searchParams = Promise.resolve({})

    render(await CommentList({params, searchParams}))

    expect(mockFetchPost).toHaveBeenCalledWith(
      'reactjs',
      'abc123',
      'best',
      undefined
    )
    const commentList = screen.getByTestId('comment-list')
    expect(commentList).toHaveTextContent('2')
    expect(commentList).toHaveAttribute('data-active-sort', 'best')
  })

  it('uses the requested sort and focuses a specific comment thread', async () => {
    mockFetchPost.mockResolvedValue({post: mockPost, comments: mockComments})
    const params = Promise.resolve({
      subreddit: 'reactjs',
      postId: 'abc123',
      slug: 'a-great-post',
      commentId: 'c1'
    })
    const searchParams = Promise.resolve({sort: 'top'})

    render(await CommentList({params, searchParams}))

    expect(mockFetchPost).toHaveBeenCalledWith('reactjs', 'abc123', 'top', 'c1')
    expect(screen.getByTestId('comment-list')).toHaveAttribute(
      'data-active-sort',
      'top'
    )
  })
})

describe('PostThread', () => {
  const params = Promise.resolve({
    subreddit: 'reactjs',
    postId: 'abc123',
    slug: 'a-great-post'
  })
  const searchParams = Promise.resolve({sort: 'top'})

  it('renders the directional transition, feed container, and post/comment suspense boundaries', () => {
    const element = PostThread({params, searchParams}) as ReactElement<{
      children: ReactElement
    }>

    expect(element.type).toBe(DirectionalTransition)

    const feedContainer = element.props.children as ReactElement<{
      children: ReactElement[]
    }>
    expect(feedContainer.type).toBe(FeedContainer)

    const [marker, postSuspense, commentsSection] = feedContainer.props
      .children as [ReactElement, ReactElement, ReactElement]

    expect(marker.type).toBe(DynamicMetadataMarker)

    // Post suspense boundary
    expect(postSuspense.type).toBe(Suspense)
    const postFallback = (postSuspense.props as {fallback: ReactElement})
      .fallback
    expect(postFallback.type).toBe(ViewTransition)
    expect((postFallback.props as {exit: string}).exit).toBe('slide-down')
    expect((postFallback.props as {children: ReactElement}).children.type).toBe(
      PostSkeleton
    )

    const postTransition = (postSuspense.props as {children: ReactElement})
      .children
    expect(postTransition.type).toBe(ViewTransition)
    expect((postTransition.props as {enter: string}).enter).toBe('slide-up')
    expect((postTransition.props as {default: string}).default).toBe('none')

    const postDetail = (postTransition.props as {children: ReactElement})
      .children
    expect((postDetail.type as {name: string}).name).toBe('PostDetail')
    expect((postDetail.props as {params: unknown}).params).toBe(params)

    // Comments section
    expect(commentsSection.type).toBe('div')
    expect((commentsSection.props as {id: string}).id).toBe('comments')
    expect((commentsSection.props as {style: object}).style).toEqual({
      scrollMarginTop: '80px'
    })

    const [title, commentsSuspense] = (
      commentsSection.props as {children: [ReactElement, ReactElement]}
    ).children

    expect(title.type).toBe(Title)
    expect((title.props as {children: string}).children).toBe('Comments')

    expect(commentsSuspense.type).toBe(Suspense)
    const commentsFallback = (
      commentsSuspense.props as {fallback: ReactElement}
    ).fallback
    expect(commentsFallback.type).toBe(ViewTransition)
    expect(
      (commentsFallback.props as {children: ReactElement}).children.type
    ).toBe(CommentListSkeleton)

    const commentsTransition = (
      commentsSuspense.props as {children: ReactElement}
    ).children
    expect(commentsTransition.type).toBe(ViewTransition)

    const commentList = (commentsTransition.props as {children: ReactElement})
      .children
    expect((commentList.type as {name: string}).name).toBe('CommentList')
    expect((commentList.props as {params: unknown}).params).toBe(params)
    expect((commentList.props as {searchParams: unknown}).searchParams).toBe(
      searchParams
    )
  })
})
