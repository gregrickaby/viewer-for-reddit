import {fetchUserInfo, savePost, votePost} from '@/lib/actions/reddit/users'
import {RedditAward, RedditComment, RedditUser} from '@/lib/types/reddit'
import {MAX_COMMENT_DEPTH} from '@/lib/utils/constants'
import {render, screen, user, waitFor} from '@/test-utils'
import {notifications} from '@mantine/notifications'
import {axe} from 'jest-axe'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import styles from './Comment.module.css'
import {Comment} from './Comment'

vi.mock('@/lib/actions/reddit/users', () => ({
  votePost: vi.fn(async () => ({success: true})),
  savePost: vi.fn(async () => ({success: true})),
  fetchUserInfo: vi.fn()
}))

const mockSharePost = vi.fn()
vi.mock('@/lib/hooks/useSharePost', () => ({
  useSharePost: () => ({sharePost: mockSharePost})
}))

const mockVotePost = vi.mocked(votePost)
const mockSavePost = vi.mocked(savePost)
const mockFetchUserInfo = vi.mocked(fetchUserInfo)

describe('Comment', () => {
  const mockComment: RedditComment = {
    id: 'test123',
    name: 't1_test123',
    author: 'testuser',
    body: 'This is a test comment',
    body_html: '<div>This is a test comment</div>',
    score: 42,
    created_utc: Date.now() / 1000 - 3600, // 1 hour ago
    likes: null,
    distinguished: undefined,
    depth: 0,
    parent_id: 't3_post123',
    permalink: '/r/test/comments/post123/_/test123',
    stickied: false,
    score_hidden: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it.each([
      {description: 'renders comment with author username', text: 'u/testuser'},
      {
        description: 'renders comment body from body_html',
        text: 'This is a test comment'
      },
      {description: 'renders comment score', text: '42'}
    ])('$description', ({text}) => {
      render(<Comment comment={mockComment} />)

      expect(screen.getByText(text)).toBeInTheDocument()
    })

    it('renders time ago', () => {
      const {container} = render(<Comment comment={mockComment} />)

      // Text is split across elements with bullet, check container
      expect(container).toHaveTextContent(/h ago/)
    })

    it('renders vote buttons', () => {
      render(<Comment comment={mockComment} />)

      expect(
        screen.getByRole('button', {name: /Upvote comment/i})
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', {name: /Downvote comment/i})
      ).toBeInTheDocument()
    })
  })

  describe('post context (user profile listing)', () => {
    it('renders the subreddit badge and post title with a link to the post', () => {
      const commentWithLink: RedditComment = {
        ...mockComment,
        subreddit: 'testsubreddit',
        subreddit_name_prefixed: 'r/testsubreddit',
        link_title: 'Some post title',
        link_permalink: '/r/testsubreddit/comments/abc123/some_post_title/'
      }
      render(<Comment comment={commentWithLink} />)

      expect(screen.getByText('r/testsubreddit')).toBeInTheDocument()
      expect(
        screen.getByRole('link', {name: 'Some post title'})
      ).toHaveAttribute(
        'href',
        '/r/testsubreddit/comments/abc123/some_post_title'
      )
    })

    it('strips the reddit.com domain so the post link stays on this site', () => {
      // Reddit's real API sends link_permalink as a fully qualified
      // reddit.com URL; using it as-is would navigate away from the app.
      const commentWithAbsoluteLink: RedditComment = {
        ...mockComment,
        subreddit: 'testsubreddit',
        subreddit_name_prefixed: 'r/testsubreddit',
        link_title: 'Some post title',
        link_permalink:
          'https://www.reddit.com/r/testsubreddit/comments/abc123/some_post_title/'
      }
      render(<Comment comment={commentWithAbsoluteLink} />)

      expect(
        screen.getByRole('link', {name: 'Some post title'})
      ).toHaveAttribute(
        'href',
        '/r/testsubreddit/comments/abc123/some_post_title'
      )
    })

    it('falls back to the subreddit badge alone when the post title is unavailable', () => {
      const commentWithSubredditOnly: RedditComment = {
        ...mockComment,
        subreddit: 'testsubreddit',
        subreddit_name_prefixed: 'r/testsubreddit',
        link_permalink: '/r/testsubreddit/comments/abc123/some_post_title/'
      }
      render(<Comment comment={commentWithSubredditOnly} />)

      expect(screen.getByText('r/testsubreddit')).toBeInTheDocument()
      expect(
        screen.queryByRole('link', {name: /post/i})
      ).not.toBeInTheDocument()
    })

    it('renders nothing when the comment has no link_permalink (regular post thread)', () => {
      // Reddit's normal post-comments endpoint sends subreddit_name_prefixed
      // on every comment, but never link_permalink - gate on link_permalink
      // so the badge doesn't show up redundantly inside a post's own thread.
      const commentInPostThread: RedditComment = {
        ...mockComment,
        subreddit: 'testsubreddit',
        subreddit_name_prefixed: 'r/testsubreddit'
      }
      render(<Comment comment={commentInPostThread} />)

      expect(screen.queryByText('r/testsubreddit')).not.toBeInTheDocument()
    })
  })

  describe('author avatar', () => {
    // Comment.tsx also renders Next `<Link>`s (author, post context), which
    // install their own IntersectionObserver for prefetching. The shared
    // `mockObserver` singleton from test-utils only tracks the most
    // recently constructed observer, so triggering it here would fire
    // Link's callback instead of ours. Use a local observer that fires
    // immediately on `observe()` so each instance invokes its own callback.
    const originalIntersectionObserver = globalThis.IntersectionObserver

    beforeEach(() => {
      class ImmediateIntersectionObserver {
        constructor(private readonly callback: IntersectionObserverCallback) {}
        observe(target: Element) {
          this.callback(
            [{isIntersecting: true, target} as IntersectionObserverEntry],
            this as unknown as IntersectionObserver
          )
        }
        unobserve() {}
        disconnect() {}
        takeRecords(): IntersectionObserverEntry[] {
          return []
        }
      }
      globalThis.IntersectionObserver =
        ImmediateIntersectionObserver as unknown as typeof IntersectionObserver
    })

    afterEach(() => {
      globalThis.IntersectionObserver = originalIntersectionObserver
    })

    it('fetches and renders the avatar once the comment scrolls into view', async () => {
      mockFetchUserInfo.mockResolvedValueOnce({
        icon_img: 'https://example.com/avatar.png'
      } as RedditUser)
      const commentWithAuthor = {...mockComment, author: 'avataruser'}

      render(<Comment comment={commentWithAuthor} />)

      await waitFor(() =>
        expect(screen.getByAltText("avataruser's avatar")).toHaveAttribute(
          'src',
          'https://example.com/avatar.png'
        )
      )
      expect(mockFetchUserInfo).toHaveBeenCalledWith('avataruser')
    })

    it.each(['[deleted]', '[removed]', 'AutoModerator'])(
      'does not fetch an avatar for the system author %s',
      (author) => {
        render(<Comment comment={{...mockComment, author}} />)

        expect(mockFetchUserInfo).not.toHaveBeenCalled()
      }
    )
  })

  describe('distinguished comments', () => {
    it('renders moderator badge for moderator comments', () => {
      const modComment = {...mockComment, distinguished: 'moderator'}
      render(<Comment comment={modComment} />)

      expect(screen.getByText('moderator')).toBeInTheDocument()
    })

    it('renders admin badge for admin comments', () => {
      const adminComment = {...mockComment, distinguished: 'admin'}
      render(<Comment comment={adminComment} />)

      expect(screen.getByText('admin')).toBeInTheDocument()
    })

    it('does not render badge for normal comments', () => {
      render(<Comment comment={mockComment} />)

      expect(screen.queryByText('moderator')).not.toBeInTheDocument()
      expect(screen.queryByText('admin')).not.toBeInTheDocument()
    })
  })

  describe('voting', () => {
    it('calls vote function when upvote button is clicked', async () => {
      render(<Comment comment={mockComment} />)

      const upvoteButton = screen.getByRole('button', {name: /Upvote comment/i})
      await user.click(upvoteButton)

      expect(mockVotePost).toHaveBeenCalledWith('t1_test123', 1)
    })

    it('calls vote function when downvote button is clicked', async () => {
      render(<Comment comment={mockComment} />)

      const downvoteButton = screen.getByRole('button', {
        name: /Downvote comment/i
      })
      await user.click(downvoteButton)

      expect(mockVotePost).toHaveBeenCalledWith('t1_test123', -1)
    })
  })

  describe('HTML sanitization', () => {
    it('sanitizes HTML entities in body_html', () => {
      const commentWithEntities = {
        ...mockComment,
        body_html: '&lt;p&gt;Hello&lt;/p&gt;'
      }
      render(<Comment comment={commentWithEntities} />)

      // Should decode entities
      expect(screen.getByText('Hello')).toBeInTheDocument()
    })

    it('removes dangerous HTML tags', () => {
      const dangerousComment = {
        ...mockComment,
        body_html: '<script>alert("xss")</script><p>Safe content</p>'
      }
      const {container} = render(<Comment comment={dangerousComment} />)

      // Script tag should be removed by sanitize-html
      // eslint-disable-next-line testing-library/no-container
      expect(container.querySelector('script')).not.toBeInTheDocument()
    })

    it('falls back to body when body_html is not provided', () => {
      const commentWithoutHtml = {
        ...mockComment,
        body_html: '',
        body: 'Plain text comment'
      }
      render(<Comment comment={commentWithoutHtml} />)

      expect(screen.getByText('Plain text comment')).toBeInTheDocument()
    })
  })

  describe('nested replies', () => {
    it('renders nested comment replies', () => {
      const commentWithReplies = {
        ...mockComment,
        replies: {
          kind: 'Listing',
          data: {
            children: [
              {
                kind: 't1',
                data: {
                  id: 'reply1',
                  name: 't1_reply1',
                  author: 'replyuser',
                  body: 'This is a reply',
                  body_html: '<div>This is a reply</div>',
                  score: 10,
                  created_utc: Date.now() / 1000 - 1800,
                  likes: null,
                  distinguished: null,
                  replies: ''
                }
              }
            ]
          }
        }
      }

      render(<Comment comment={commentWithReplies as any} />)

      expect(screen.getByText('u/testuser')).toBeInTheDocument()
      expect(screen.getByText('u/replyuser')).toBeInTheDocument()
      expect(screen.getByText('This is a reply')).toBeInTheDocument()
    })

    it('collapses a nested reply and its grandchildren independently of the parent', async () => {
      const commentWithGrandchild = {
        ...mockComment,
        replies: {
          kind: 'Listing',
          data: {
            children: [
              {
                kind: 't1',
                data: {
                  id: 'reply1',
                  name: 't1_reply1',
                  author: 'replyuser',
                  body: 'This is a reply',
                  body_html: '<div>This is a reply</div>',
                  score: 10,
                  created_utc: Date.now() / 1000 - 1800,
                  likes: null,
                  distinguished: null,
                  depth: 1,
                  replies: {
                    kind: 'Listing',
                    data: {
                      children: [
                        {
                          kind: 't1',
                          data: {
                            id: 'grandchild1',
                            name: 't1_grandchild1',
                            author: 'grandchilduser',
                            body: 'This is a grandchild reply',
                            body_html: '<div>This is a grandchild reply</div>',
                            score: 2,
                            created_utc: Date.now() / 1000 - 900,
                            likes: null,
                            distinguished: null,
                            depth: 2,
                            replies: ''
                          }
                        }
                      ]
                    }
                  }
                }
              }
            ]
          }
        }
      }

      render(<Comment comment={commentWithGrandchild as any} />)

      // Parent, reply, and grandchild all visible expanded
      expect(screen.getByText('This is a reply')).toBeInTheDocument()
      expect(screen.getByText('This is a grandchild reply')).toBeInTheDocument()

      // Collapse just the nested reply (the second collapse button - the
      // first belongs to the top-level comment)
      const [, replyCollapseButton] = screen.getAllByRole('button', {
        name: /collapse comment/i
      })
      await user.click(replyCollapseButton)

      await waitFor(() => {
        expect(replyCollapseButton).toHaveAttribute('aria-expanded', 'false')
      })

      // The grandchild is hidden, but the top-level comment body stays visible
      expect(screen.getByText('This is a grandchild reply')).not.toBeVisible()
      expect(screen.getByText('This is a test comment')).toBeVisible()
    })

    it('renders multiple nested replies', () => {
      const commentWithMultipleReplies = {
        ...mockComment,
        replies: {
          kind: 'Listing',
          data: {
            children: [
              {
                kind: 't1',
                data: {
                  id: 'reply1',
                  name: 't1_reply1',
                  author: 'user1',
                  body: 'First reply',
                  body_html: '<div>First reply</div>',
                  score: 5,
                  created_utc: Date.now() / 1000,
                  likes: null,
                  distinguished: null,
                  replies: ''
                }
              },
              {
                kind: 't1',
                data: {
                  id: 'reply2',
                  name: 't1_reply2',
                  author: 'user2',
                  body: 'Second reply',
                  body_html: '<div>Second reply</div>',
                  score: 3,
                  created_utc: Date.now() / 1000,
                  likes: null,
                  distinguished: null,
                  replies: ''
                }
              }
            ]
          }
        }
      }

      render(<Comment comment={commentWithMultipleReplies as any} />)

      expect(screen.getByText('u/user1')).toBeInTheDocument()
      expect(screen.getByText('u/user2')).toBeInTheDocument()
      expect(screen.getByText('First reply')).toBeInTheDocument()
      expect(screen.getByText('Second reply')).toBeInTheDocument()
    })

    it('filters out non-comment children from replies', () => {
      const commentWithMixedReplies = {
        ...mockComment,
        replies: {
          kind: 'Listing',
          data: {
            children: [
              {
                kind: 't1',
                data: {
                  id: 'reply1',
                  name: 't1_reply1',
                  author: 'user1',
                  body: 'Valid reply',
                  body_html: '<div>Valid reply</div>',
                  score: 5,
                  created_utc: Date.now() / 1000,
                  likes: null,
                  distinguished: null,
                  replies: ''
                }
              },
              {kind: 'more', data: {}} // Should be filtered out
            ]
          }
        }
      }

      render(<Comment comment={commentWithMixedReplies as any} />)

      expect(screen.getByText('Valid reply')).toBeInTheDocument()
      // Only one user (plus the parent comment's user)
      const users = screen.getAllByText(/u\//i)
      expect(users).toHaveLength(2) // testuser + user1
    })
  })

  describe('collapse functionality', () => {
    it('shows a collapse button at any nesting depth', () => {
      const {rerender} = render(<Comment comment={mockComment} depth={0} />)

      expect(
        screen.getByRole('button', {name: /collapse comment/i})
      ).toBeInTheDocument()

      rerender(<Comment comment={mockComment} depth={1} />)

      expect(
        screen.getByRole('button', {name: /collapse comment/i})
      ).toBeInTheDocument()
    })

    it('starts with comment expanded by default', () => {
      render(<Comment comment={mockComment} />)

      // Comment body should be visible
      expect(screen.getByText('This is a test comment')).toBeInTheDocument()

      // Voting buttons should be visible
      expect(
        screen.getByRole('button', {name: /upvote comment/i})
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', {name: /downvote comment/i})
      ).toBeInTheDocument()

      // Should show chevron up icon (collapse)
      const collapseButton = screen.getByRole('button', {
        name: /collapse comment/i
      })
      expect(collapseButton).toHaveAttribute('aria-expanded', 'true')
    })

    it('collapses comment body when collapse button clicked', async () => {
      render(<Comment comment={mockComment} />)

      const collapseButton = screen.getByRole('button', {
        name: /collapse comment/i
      })

      // Click to collapse
      await user.click(collapseButton)

      // Wait for state change
      await waitFor(() => {
        expect(collapseButton).toHaveAttribute('aria-expanded', 'false')
      })

      // Button text should change to "Expand"
      expect(
        screen.getByRole('button', {name: /expand comment/i})
      ).toBeInTheDocument()
    })

    it('shows reply count when collapsed and has replies', async () => {
      const commentWithMultipleReplies = {
        ...mockComment,
        replies: {
          kind: 'Listing' as const,
          data: {
            children: [
              {
                kind: 't1' as const,
                data: {
                  id: 'reply1',
                  name: 't1_reply1',
                  author: 'user1',
                  body: 'First reply',
                  body_html: '<div>First reply</div>',
                  score: 5,
                  created_utc: Date.now() / 1000,
                  likes: null,
                  distinguished: undefined,
                  depth: 1,
                  parent_id: 't1_test123',
                  permalink: '/r/test/comments/post123/_/reply1',
                  stickied: false,
                  score_hidden: false
                }
              },
              {
                kind: 't1' as const,
                data: {
                  id: 'reply2',
                  name: 't1_reply2',
                  author: 'user2',
                  body: 'Second reply',
                  body_html: '<div>Second reply</div>',
                  score: 3,
                  created_utc: Date.now() / 1000,
                  likes: null,
                  distinguished: undefined,
                  depth: 1,
                  parent_id: 't1_test123',
                  permalink: '/r/test/comments/post123/_/reply2',
                  stickied: false,
                  score_hidden: false
                }
              }
            ]
          }
        }
      }

      render(<Comment comment={commentWithMultipleReplies} depth={0} />)

      // Reply count should not be visible when expanded
      expect(screen.queryByText('(2 replies)')).not.toBeInTheDocument()

      // Collapse the top-level comment (first in DOM order; replies have
      // their own collapse buttons too now that nesting can collapse)
      const [collapseButton] = screen.getAllByRole('button', {
        name: /collapse comment/i
      })
      await user.click(collapseButton)

      await waitFor(() => {
        expect(collapseButton).toHaveAttribute('aria-expanded', 'false')
      })

      // Reply count should be visible when collapsed
      expect(screen.getByText('(2 replies)')).toBeInTheDocument()
    })

    it('has proper accessibility attributes for collapse button', () => {
      render(<Comment comment={mockComment} depth={0} />)

      const collapseButton = screen.getByRole('button', {
        name: /collapse comment/i
      })

      expect(collapseButton).toHaveAttribute('aria-label', 'Collapse comment')
      expect(collapseButton).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('edge cases', () => {
    it('handles comment with zero score', () => {
      const zeroScoreComment = {...mockComment, score: 0}
      render(<Comment comment={zeroScoreComment} />)

      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('handles comment with negative score', () => {
      const negativeScoreComment = {...mockComment, score: -5}
      render(<Comment comment={negativeScoreComment} />)

      expect(screen.getByText('-5')).toBeInTheDocument()
    })

    it('handles comment with deleted author', () => {
      const deletedComment = {...mockComment, author: '[deleted]'}
      render(<Comment comment={deletedComment} />)

      expect(screen.getByText('u/[deleted]')).toBeInTheDocument()
    })

    it('handles comment with no replies', () => {
      const noRepliesComment = {...mockComment, replies: undefined}
      render(<Comment comment={noRepliesComment} />)

      expect(screen.getByText('u/testuser')).toBeInTheDocument()
      // Should only have one username (the parent)
      expect(screen.getAllByText(/u\//i)).toHaveLength(1)
    })

    it('handles very long comment body', () => {
      const longComment = {
        ...mockComment,
        body: 'A'.repeat(10000),
        body_html: `<div>${'A'.repeat(10000)}</div>`
      }
      render(<Comment comment={longComment} />)

      expect(screen.getByText('A'.repeat(10000))).toBeInTheDocument()
    })
  })

  describe('awards', () => {
    const testAward: RedditAward = {
      id: 'award_1',
      name: 'Gold',
      icon_url: 'https://example.redditstatic.com/gold.png',
      count: 2
    }

    it('renders an award icon when the comment has awardings', () => {
      const awardedComment = {...mockComment, all_awardings: [testAward]}
      render(<Comment comment={awardedComment} />)

      expect(screen.getByRole('img', {name: 'Gold'})).toBeInTheDocument()
    })

    it('does not render award icons when the comment has no awardings', () => {
      render(<Comment comment={mockComment} />)

      expect(screen.queryByRole('img', {name: 'Gold'})).not.toBeInTheDocument()
    })
  })

  describe('gilded highlight', () => {
    const testAward: RedditAward = {
      id: 'award_1',
      name: 'Gold',
      icon_url: 'https://example.redditstatic.com/gold.png',
      count: 1
    }

    it('applies the gilded class to the card when the comment has awardings', () => {
      const awardedComment = {...mockComment, all_awardings: [testAward]}
      const {container} = render(<Comment comment={awardedComment} />)

      // eslint-disable-next-line testing-library/no-container
      const card = container.querySelector('.mantine-Card-root')
      expect(card).toHaveClass(styles.gilded)
    })

    it('does not apply the gilded class to comments without awardings', () => {
      const {container} = render(<Comment comment={mockComment} />)

      // eslint-disable-next-line testing-library/no-container
      const card = container.querySelector('.mantine-Card-root')
      expect(card).not.toHaveClass(styles.gilded)
    })
  })

  describe('save action', () => {
    it('saves the comment and shows a saved notification when not yet saved', async () => {
      const showSpy = vi.spyOn(notifications, 'show')
      render(<Comment comment={mockComment} />)

      await user.click(screen.getByRole('button', {name: 'Save comment'}))

      expect(mockSavePost).toHaveBeenCalledWith('t1_test123', true)
      expect(showSpy).toHaveBeenCalledWith({
        message: 'Comment saved',
        color: 'yellow',
        autoClose: 3000
      })
    })

    it('unsaves the comment and shows an unsaved notification when already saved', async () => {
      const showSpy = vi.spyOn(notifications, 'show')
      const savedComment = {...mockComment, saved: true}
      render(<Comment comment={savedComment} />)

      await user.click(screen.getByRole('button', {name: 'Unsave comment'}))

      expect(mockSavePost).toHaveBeenCalledWith('t1_test123', false)
      expect(showSpy).toHaveBeenCalledWith({
        message: 'Comment unsaved',
        color: 'gray',
        autoClose: 3000
      })
    })
  })

  describe('share action', () => {
    it('shares the comment permalink when the share button is clicked', async () => {
      render(<Comment comment={mockComment} />)

      await user.click(screen.getByRole('button', {name: 'Share comment'}))

      expect(mockSharePost).toHaveBeenCalledWith(mockComment.permalink)
    })
  })

  describe('deep nesting (continue thread link)', () => {
    it('renders a "Continue this thread" link instead of replies at max depth', () => {
      const deepComment = {
        ...mockComment,
        permalink: '/r/test/comments/postid/slug/commentid/comment_name/'
      }
      render(<Comment comment={deepComment} depth={MAX_COMMENT_DEPTH} />)

      const link = screen.getByRole('link', {name: /continue this thread/i})
      expect(link).toHaveAttribute(
        'href',
        '/r/test/comments/postid/slug/commentid'
      )
    })

    it('falls back to the raw permalink when it has too few segments', () => {
      const deepComment = {
        ...mockComment,
        permalink: '/r/test/comments/postid'
      }
      render(<Comment comment={deepComment} depth={MAX_COMMENT_DEPTH} />)

      const link = screen.getByRole('link', {name: /continue this thread/i})
      expect(link).toHaveAttribute('href', '/r/test/comments/postid')
    })

    it('does not render a continue thread link below max depth', () => {
      render(<Comment comment={mockComment} depth={MAX_COMMENT_DEPTH - 1} />)

      expect(
        screen.queryByRole('link', {name: /continue this thread/i})
      ).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has no axe violations', async () => {
      const {container} = render(<Comment comment={mockComment} />)

      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
