import {render, screen, user} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
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

  it('renders all sort options in the dropdown', async () => {
    render(
      <UserCommentListWithTabs
        comments={mockComments}
        activeSort="new"
        username="testuser"
      />
    )

    await user.click(screen.getByRole('button', {name: /sort by new/i}))

    expect(await screen.findByText('Hot')).toBeInTheDocument()
    expect(screen.getByText('Top')).toBeInTheDocument()
    expect(screen.getByText('Controversial')).toBeInTheDocument()
  })

  it('changes sort when option clicked', async () => {
    render(
      <UserCommentListWithTabs
        comments={mockComments}
        activeSort="new"
        username="testuser"
      />
    )

    await user.click(screen.getByRole('button', {name: /sort by new/i}))
    await user.click(await screen.findByText('Hot'))

    expect(mockPush).toHaveBeenCalledWith('/u/testuser?tab=comments&sort=hot', {
      scroll: false
    })
  })

  it('shows time filter for top sort', async () => {
    render(
      <UserCommentListWithTabs
        comments={mockComments}
        activeSort="top"
        activeTimeFilter="day"
        username="testuser"
      />
    )

    await user.click(screen.getByRole('button', {name: /filter by time day/i}))

    expect(await screen.findByText('Hour')).toBeInTheDocument()
    expect(screen.getByText('Week')).toBeInTheDocument()
    expect(screen.getByText('Month')).toBeInTheDocument()
    expect(screen.getByText('Year')).toBeInTheDocument()
    expect(screen.getByText('All Time')).toBeInTheDocument()
  })

  it('shows time filter for controversial sort', async () => {
    render(
      <UserCommentListWithTabs
        comments={mockComments}
        activeSort="controversial"
        activeTimeFilter="week"
        username="testuser"
      />
    )

    await user.click(screen.getByRole('button', {name: /filter by time week/i}))

    expect(await screen.findByText('Hour')).toBeInTheDocument()
  })

  it('does not show time filter for hot sort', () => {
    render(
      <UserCommentListWithTabs
        comments={mockComments}
        activeSort="hot"
        username="testuser"
      />
    )

    expect(
      screen.queryByRole('button', {name: /filter by time/i})
    ).not.toBeInTheDocument()
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

    await user.click(screen.getByRole('button', {name: /filter by time day/i}))
    await user.click(await screen.findByText('Week'))

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

    await user.click(screen.getByRole('button', {name: /sort by top/i}))
    await user.click(await screen.findByText('Controversial'))

    expect(mockPush).toHaveBeenCalledWith(
      '/u/testuser?tab=comments&sort=controversial&time=month',
      {scroll: false}
    )
  })

  it('skips navigation when the username cannot build a valid profile href', async () => {
    render(
      <UserCommentListWithTabs
        comments={mockComments}
        activeSort="new"
        username=""
      />
    )

    await user.click(screen.getByRole('button', {name: /sort by new/i}))
    await user.click(await screen.findByText('Hot'))

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('defaults the time filter display to "all" when none is active', () => {
    render(
      <UserCommentListWithTabs
        comments={mockComments}
        activeSort="top"
        username="testuser"
      />
    )

    expect(
      screen.getByRole('button', {name: /filter by time all time/i})
    ).toBeInTheDocument()
  })

  it('prevents race conditions during sort change', async () => {
    render(
      <UserCommentListWithTabs
        comments={mockComments}
        activeSort="new"
        username="testuser"
      />
    )

    await user.click(screen.getByRole('button', {name: /sort by new/i}))
    await user.click(await screen.findByText('Hot'))

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

    await user.click(screen.getByRole('button', {name: /sort by new/i}))
    await user.click(await screen.findByText('Hot'))

    expect(mockPush).toHaveBeenCalledWith('/u/testuser?tab=comments&sort=hot', {
      scroll: false
    })
  })
})
