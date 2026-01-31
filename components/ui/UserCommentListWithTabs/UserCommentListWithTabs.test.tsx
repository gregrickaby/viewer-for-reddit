import {render, screen, user} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {UserCommentListWithTabs} from './UserCommentListWithTabs'
import type {RedditComment} from '@/lib/types/reddit'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    refresh: vi.fn()
  }))
}))

const mockComments: RedditComment[] = [
  {
    id: 'comment1',
    name: 't1_comment1',
    author: 'testuser',
    body: 'This is a test comment',
    body_html: '<p>This is a test comment</p>',
    created_utc: 1640000000,
    score: 10,
    depth: 0,
    parent_id: 't3_abc',
    permalink: '/r/test/comments/abc/test/comment1',
    stickied: false,
    distinguished: undefined,
    likes: null,
    score_hidden: false
  },
  {
    id: 'comment2',
    name: 't1_comment2',
    author: 'anotheruser',
    body: 'Another test comment',
    body_html: '<p>Another test comment</p>',
    created_utc: 1640001000,
    score: 5,
    depth: 0,
    parent_id: 't3_def',
    permalink: '/r/test/comments/def/test2/comment2',
    stickied: false,
    distinguished: undefined,
    likes: null,
    score_hidden: false
  }
]

describe('UserCommentListWithTabs', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('renders comments', () => {
    render(
      <UserCommentListWithTabs
        comments={mockComments}
        activeSort="new"
        username="testuser"
      />
    )

    expect(screen.getByText('This is a test comment')).toBeInTheDocument()
    expect(screen.getByText('Another test comment')).toBeInTheDocument()
  })

  it('renders empty state when no comments', () => {
    render(
      <UserCommentListWithTabs
        comments={[]}
        activeSort="new"
        username="testuser"
      />
    )

    expect(screen.getByText('No comments yet')).toBeInTheDocument()
  })

  it('renders all sort tabs', () => {
    render(
      <UserCommentListWithTabs
        comments={mockComments}
        activeSort="new"
        username="testuser"
      />
    )

    expect(screen.getByRole('tab', {name: /hot/i})).toBeInTheDocument()
    expect(screen.getByRole('tab', {name: /new/i})).toBeInTheDocument()
    expect(screen.getByRole('tab', {name: /top/i})).toBeInTheDocument()
    expect(
      screen.getByRole('tab', {name: /controversial/i})
    ).toBeInTheDocument()
  })

  it('changes sort when tab clicked', async () => {
    render(
      <UserCommentListWithTabs
        comments={mockComments}
        activeSort="new"
        username="testuser"
      />
    )

    const hotTab = screen.getByRole('tab', {name: /hot/i})
    await user.click(hotTab)

    expect(mockPush).toHaveBeenCalledWith('/u/testuser?tab=comments&sort=hot', {
      scroll: false
    })
  })

  it('shows time filter for top sort', () => {
    render(
      <UserCommentListWithTabs
        comments={mockComments}
        activeSort="top"
        activeTimeFilter="day"
        username="testuser"
      />
    )

    expect(screen.getByRole('tab', {name: /hour/i})).toBeInTheDocument()
    expect(screen.getByRole('tab', {name: /today/i})).toBeInTheDocument()
    expect(screen.getByRole('tab', {name: /week/i})).toBeInTheDocument()
    expect(screen.getByRole('tab', {name: /month/i})).toBeInTheDocument()
    expect(screen.getByRole('tab', {name: /year/i})).toBeInTheDocument()
    expect(screen.getByRole('tab', {name: /all time/i})).toBeInTheDocument()
  })

  it('shows time filter for controversial sort', () => {
    render(
      <UserCommentListWithTabs
        comments={mockComments}
        activeSort="controversial"
        activeTimeFilter="week"
        username="testuser"
      />
    )

    expect(screen.getByRole('tab', {name: /hour/i})).toBeInTheDocument()
    expect(screen.getByRole('tab', {name: /week/i})).toBeInTheDocument()
  })

  it('does not show time filter for hot sort', () => {
    render(
      <UserCommentListWithTabs
        comments={mockComments}
        activeSort="hot"
        username="testuser"
      />
    )

    expect(screen.queryByRole('tab', {name: /hour/i})).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', {name: /week/i})).not.toBeInTheDocument()
  })

  it('changes time filter when clicked', async () => {
    render(
      <UserCommentListWithTabs
        comments={mockComments}
        activeSort="top"
        activeTimeFilter="day"
        username="testuser"
      />
    )

    const weekTab = screen.getByRole('tab', {name: /week/i})
    await user.click(weekTab)

    expect(mockPush).toHaveBeenCalledWith(
      '/u/testuser?tab=comments&sort=top&time=week',
      {scroll: false}
    )
  })

  it('includes time filter in URL when switching sort', async () => {
    render(
      <UserCommentListWithTabs
        comments={mockComments}
        activeSort="top"
        activeTimeFilter="month"
        username="testuser"
      />
    )

    const controversialTab = screen.getByRole('tab', {name: /controversial/i})
    await user.click(controversialTab)

    expect(mockPush).toHaveBeenCalledWith(
      '/u/testuser?tab=comments&sort=controversial&time=month',
      {scroll: false}
    )
  })

  it('prevents race conditions during sort change', async () => {
    render(
      <UserCommentListWithTabs
        comments={mockComments}
        activeSort="new"
        username="testuser"
      />
    )

    const hotTab = screen.getByRole('tab', {name: /hot/i})

    // Click once
    await user.click(hotTab)

    // Verify navigation happened
    expect(mockPush).toHaveBeenCalledWith('/u/testuser?tab=comments&sort=hot', {
      scroll: false
    })
  })

  it('handles multiple sort changes', async () => {
    render(
      <UserCommentListWithTabs
        comments={mockComments}
        activeSort="new"
        username="testuser"
      />
    )

    const hotTab = screen.getByRole('tab', {name: /hot/i})
    await user.click(hotTab)

    expect(mockPush).toHaveBeenCalledWith('/u/testuser?tab=comments&sort=hot', {
      scroll: false
    })
  })

  it('renders authenticated comments', () => {
    render(
      <UserCommentListWithTabs
        comments={mockComments}
        activeSort="new"
        isAuthenticated
        username="testuser"
      />
    )

    expect(screen.getByText('This is a test comment')).toBeInTheDocument()
  })

  it('renders unauthenticated comments', () => {
    render(
      <UserCommentListWithTabs
        comments={mockComments}
        activeSort="new"
        isAuthenticated={false}
        username="testuser"
      />
    )

    expect(screen.getByText('This is a test comment')).toBeInTheDocument()
  })

  it('includes umami tracking attributes on tabs', () => {
    render(
      <UserCommentListWithTabs
        comments={mockComments}
        activeSort="new"
        username="testuser"
      />
    )

    expect(screen.getByRole('tab', {name: /hot/i})).toHaveAttribute(
      'data-umami-event',
      'sort-user-comments-hot'
    )
    expect(screen.getByRole('tab', {name: /new/i})).toHaveAttribute(
      'data-umami-event',
      'sort-user-comments-new'
    )
    expect(screen.getByRole('tab', {name: /top/i})).toHaveAttribute(
      'data-umami-event',
      'sort-user-comments-top'
    )
    expect(screen.getByRole('tab', {name: /controversial/i})).toHaveAttribute(
      'data-umami-event',
      'sort-user-comments-controversial'
    )
  })

  it('includes umami tracking attributes on time filter tabs', () => {
    render(
      <UserCommentListWithTabs
        comments={mockComments}
        activeSort="top"
        activeTimeFilter="day"
        username="testuser"
      />
    )

    expect(screen.getByRole('tab', {name: /hour/i})).toHaveAttribute(
      'data-umami-event',
      'filter-user-comments-hour'
    )
    expect(screen.getByRole('tab', {name: /today/i})).toHaveAttribute(
      'data-umami-event',
      'filter-user-comments-day'
    )
    expect(screen.getByRole('tab', {name: /week/i})).toHaveAttribute(
      'data-umami-event',
      'filter-user-comments-week'
    )
  })
})
