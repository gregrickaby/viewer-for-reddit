import type {RedditComment} from '@/lib/types/reddit'
import {render, screen, user} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn()
  }),
  usePathname: () => '/r/test/comments/test123'
}))

vi.mock('@/lib/hooks', () => ({
  useVote: vi.fn(() => ({
    voteState: 0,
    score: 50,
    isPending: false,
    vote: vi.fn()
  })),
  useSavePost: vi.fn(() => ({
    isSaved: false,
    isPending: false,
    toggleSave: vi.fn()
  }))
}))

const {CommentListWithTabs} = await import('./CommentListWithTabs')

const mockComment: RedditComment = {
  id: 'comment1',
  name: 't1_comment1',
  author: 'testuser',
  body: 'Test comment',
  body_html: '<p>Test comment</p>',
  created_utc: Date.now() / 1000 - 3600,
  score: 50,
  likes: null,
  depth: 0,
  permalink: '/r/test/comments/test123/_/comment1',
  parent_id: 't3_test123',
  distinguished: undefined,
  stickied: false,
  score_hidden: false
}

describe('CommentListWithTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('tabs rendering', () => {
    it('renders all comment sort tabs', () => {
      render(<CommentListWithTabs comments={[mockComment]} activeSort="best" />)

      expect(screen.getByRole('tab', {name: /best/i})).toBeInTheDocument()
      expect(screen.getByRole('tab', {name: /top/i})).toBeInTheDocument()
      expect(screen.getByRole('tab', {name: /new/i})).toBeInTheDocument()
      expect(
        screen.getByRole('tab', {name: /controversial/i})
      ).toBeInTheDocument()
      expect(screen.getByRole('tab', {name: /old/i})).toBeInTheDocument()
      expect(screen.getByRole('tab', {name: /q&a/i})).toBeInTheDocument()
    })

    it('marks active tab correctly', () => {
      render(<CommentListWithTabs comments={[mockComment]} activeSort="top" />)

      const topTab = screen.getByRole('tab', {name: /^top$/i})
      expect(topTab).toHaveAttribute('data-active', 'true')
    })

    it('renders tab icons', () => {
      const {container} = render(
        <CommentListWithTabs comments={[mockComment]} activeSort="best" />
      )

      // Check for SVG icons in tabs
      // eslint-disable-next-line testing-library/no-container
      const icons = container.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThanOrEqual(6)
    })
  })

  describe('sort navigation', () => {
    it('navigates when clicking best tab', async () => {
      render(<CommentListWithTabs comments={[mockComment]} activeSort="top" />)

      const bestTab = screen.getByRole('tab', {name: /best/i})
      await user.click(bestTab)

      expect(mockPush).toHaveBeenCalledWith('?sort=best', {scroll: false})
    })

    it('navigates when clicking top tab', async () => {
      render(<CommentListWithTabs comments={[mockComment]} activeSort="best" />)

      const topTab = screen.getByRole('tab', {name: /^top$/i})
      await user.click(topTab)

      expect(mockPush).toHaveBeenCalledWith('?sort=top', {scroll: false})
    })

    it('navigates when clicking new tab', async () => {
      render(<CommentListWithTabs comments={[mockComment]} activeSort="best" />)

      const newTab = screen.getByRole('tab', {name: /^new$/i})
      await user.click(newTab)

      expect(mockPush).toHaveBeenCalledWith('?sort=new', {scroll: false})
    })

    it('navigates when clicking controversial tab', async () => {
      render(<CommentListWithTabs comments={[mockComment]} activeSort="best" />)

      const controversialTab = screen.getByRole('tab', {name: /controversial/i})
      await user.click(controversialTab)

      expect(mockPush).toHaveBeenCalledWith('?sort=controversial', {
        scroll: false
      })
    })

    it('navigates when clicking old tab', async () => {
      render(<CommentListWithTabs comments={[mockComment]} activeSort="best" />)

      const oldTab = screen.getByRole('tab', {name: /old/i})
      await user.click(oldTab)

      expect(mockPush).toHaveBeenCalledWith('?sort=old', {scroll: false})
    })

    it('navigates when clicking Q&A tab', async () => {
      render(<CommentListWithTabs comments={[mockComment]} activeSort="best" />)

      const qaTab = screen.getByRole('tab', {name: /q&a/i})
      await user.click(qaTab)

      expect(mockPush).toHaveBeenCalledWith('?sort=qa', {scroll: false})
    })

    it('preserves scroll position on navigation', async () => {
      render(<CommentListWithTabs comments={[mockComment]} activeSort="best" />)

      const topTab = screen.getByRole('tab', {name: /^top$/i})
      await user.click(topTab)

      expect(mockPush).toHaveBeenCalledWith('?sort=top', {scroll: false})
    })
  })

  describe('comments rendering', () => {
    it('renders comment list', () => {
      render(<CommentListWithTabs comments={[mockComment]} activeSort="best" />)

      expect(screen.getByText('Test comment')).toBeInTheDocument()
    })

    it('renders multiple comments', () => {
      const comments = [
        mockComment,
        {
          ...mockComment,
          id: 'comment2',
          name: 't1_comment2',
          body: 'Second comment',
          body_html: '<p>Second comment</p>'
        }
      ]

      render(<CommentListWithTabs comments={comments} activeSort="best" />)

      expect(screen.getByText('Test comment')).toBeInTheDocument()
      expect(screen.getByText('Second comment')).toBeInTheDocument()
    })

    it('passes isAuthenticated to Comment', () => {
      render(
        <CommentListWithTabs
          comments={[mockComment]}
          activeSort="best"
          isAuthenticated
        />
      )

      // Check for vote buttons (only visible when authenticated)
      expect(
        screen.getByRole('button', {name: /upvote comment/i})
      ).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('shows no comments message when list is empty', () => {
      render(<CommentListWithTabs comments={[]} activeSort="best" />)

      expect(
        screen.getByRole('heading', {name: /no comments yet/i})
      ).toBeInTheDocument()
    })

    it('does not show no comments when there are comments', () => {
      render(<CommentListWithTabs comments={[mockComment]} activeSort="best" />)

      expect(
        screen.queryByRole('heading', {name: /no comments yet/i})
      ).not.toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles all sort options', () => {
      const sorts: Array<
        'best' | 'top' | 'new' | 'controversial' | 'old' | 'qa'
      > = ['best', 'top', 'new', 'controversial', 'old', 'qa']

      sorts.forEach((sort) => {
        const {unmount} = render(
          <CommentListWithTabs comments={[mockComment]} activeSort={sort} />
        )

        const tabName = sort === 'qa' ? /q&a/i : new RegExp(sort, 'i')
        const tab = screen.getByRole('tab', {name: tabName})
        expect(tab).toHaveAttribute('data-active', 'true')

        unmount()
      })
    })

    it('handles many comments', () => {
      const manyComments = Array.from({length: 50}, (_, i) => ({
        ...mockComment,
        id: `comment${i}`,
        name: `t1_comment${i}`,
        body: `Comment ${i}`,
        body_html: `<p>Comment ${i}</p>`
      }))

      const {container} = render(
        <CommentListWithTabs comments={manyComments} activeSort="best" />
      )

      // Check that comments are rendered (text may be split)
      expect(container).toHaveTextContent(/Comment 0/)
      expect(container).toHaveTextContent(/Comment 49/)
    })
  })
})
