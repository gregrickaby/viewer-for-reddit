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
  })),
  useCommentCollapse: vi.fn(() => ({
    isCollapsed: false,
    toggleCollapse: vi.fn()
  })),
  useSharePost: vi.fn(() => ({
    sharePost: vi.fn()
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

/** Opens the sort dropdown via its trigger button. */
async function openSortMenu(triggerName: RegExp) {
  await user.click(screen.getByRole('button', {name: triggerName}))
}

describe('CommentListWithTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('tabs rendering', () => {
    it('renders all comment sort options in the dropdown', async () => {
      render(<CommentListWithTabs comments={[mockComment]} activeSort="best" />)

      await openSortMenu(/sort by best/i)

      expect(await screen.findByText('Top')).toBeInTheDocument()
      expect(screen.getByText('New')).toBeInTheDocument()
      expect(screen.getByText('Controversial')).toBeInTheDocument()
      expect(screen.getByText('Old')).toBeInTheDocument()
      expect(screen.getByText('Q&A')).toBeInTheDocument()
    })

    it('shows the active sort on the trigger button', () => {
      render(<CommentListWithTabs comments={[mockComment]} activeSort="top" />)

      expect(
        screen.getByRole('button', {name: /sort by top/i})
      ).toBeInTheDocument()
    })

    it('renders tab icons', async () => {
      const {container} = render(
        <CommentListWithTabs comments={[mockComment]} activeSort="best" />
      )

      await openSortMenu(/sort by best/i)

      // eslint-disable-next-line testing-library/no-container
      const icons = container.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThanOrEqual(6)
    })
  })

  describe('sort navigation', () => {
    it('navigates when clicking best option', async () => {
      render(<CommentListWithTabs comments={[mockComment]} activeSort="top" />)

      await openSortMenu(/sort by top/i)
      await user.click(await screen.findByText('Best'))

      expect(mockPush).toHaveBeenCalledWith('?sort=best', {scroll: false})
    })

    it('navigates when clicking top option', async () => {
      render(<CommentListWithTabs comments={[mockComment]} activeSort="best" />)

      await openSortMenu(/sort by best/i)
      await user.click(await screen.findByText('Top'))

      expect(mockPush).toHaveBeenCalledWith('?sort=top', {scroll: false})
    })

    it('navigates when clicking new option', async () => {
      render(<CommentListWithTabs comments={[mockComment]} activeSort="best" />)

      await openSortMenu(/sort by best/i)
      await user.click(await screen.findByText('New'))

      expect(mockPush).toHaveBeenCalledWith('?sort=new', {scroll: false})
    })

    it('navigates when clicking controversial option', async () => {
      render(<CommentListWithTabs comments={[mockComment]} activeSort="best" />)

      await openSortMenu(/sort by best/i)
      await user.click(await screen.findByText('Controversial'))

      expect(mockPush).toHaveBeenCalledWith('?sort=controversial', {
        scroll: false
      })
    })

    it('navigates when clicking old option', async () => {
      render(<CommentListWithTabs comments={[mockComment]} activeSort="best" />)

      await openSortMenu(/sort by best/i)
      await user.click(await screen.findByText('Old'))

      expect(mockPush).toHaveBeenCalledWith('?sort=old', {scroll: false})
    })

    it('navigates when clicking Q&A option', async () => {
      render(<CommentListWithTabs comments={[mockComment]} activeSort="best" />)

      await openSortMenu(/sort by best/i)
      await user.click(await screen.findByText('Q&A'))

      expect(mockPush).toHaveBeenCalledWith('?sort=qa', {scroll: false})
    })

    it('preserves scroll position on navigation', async () => {
      render(<CommentListWithTabs comments={[mockComment]} activeSort="best" />)

      await openSortMenu(/sort by best/i)
      await user.click(await screen.findByText('Top'))

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

        const triggerName =
          sort === 'qa' ? /sort by q&a/i : new RegExp(`sort by ${sort}`, 'i')
        expect(
          screen.getByRole('button', {name: triggerName})
        ).toBeInTheDocument()

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
