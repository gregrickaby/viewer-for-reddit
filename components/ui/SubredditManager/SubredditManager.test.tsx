import {
  searchSubredditsAndUsers,
  toggleSubscription
} from '@/lib/actions/reddit'
import {render, screen, waitFor} from '@/test-utils'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {SubredditManager} from './SubredditManager'

vi.mock('@/lib/actions/reddit', () => ({
  toggleSubscription: vi.fn(async () => ({success: true})),
  searchSubredditsAndUsers: vi.fn(async () => ({success: true, data: []}))
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: {error: vi.fn()}
}))

const mockToggle = vi.mocked(toggleSubscription)
const mockSearch = vi.mocked(searchSubredditsAndUsers)

const mockSubscriptions = [
  {name: 'programming', displayName: 'r/programming', icon: ''},
  {name: 'javascript', displayName: 'r/javascript', icon: ''}
]

const baseProps = {
  opened: true,
  onClose: vi.fn(),
  subscriptions: mockSubscriptions
}

describe('SubredditManager', () => {
  beforeEach(() => {
    mockToggle.mockClear()
    mockSearch.mockClear()
    mockToggle.mockResolvedValue({success: true})
    mockSearch.mockResolvedValue({success: true, data: []})
  })

  describe('rendering', () => {
    it('renders the drawer when opened', () => {
      render(<SubredditManager {...baseProps} />)

      expect(screen.getByText('Manage Subreddits')).toBeInTheDocument()
    })

    it('does not render drawer content when closed', () => {
      render(<SubredditManager {...baseProps} opened={false} />)

      expect(screen.queryByText('Manage Subreddits')).not.toBeInTheDocument()
    })

    it('renders search section', () => {
      render(<SubredditManager {...baseProps} />)

      expect(screen.getByText('Find a Subreddit')).toBeInTheDocument()
      expect(
        screen.getByRole('textbox', {name: /search subreddits/i})
      ).toBeInTheDocument()
    })

    it('renders subscription count', () => {
      render(<SubredditManager {...baseProps} />)

      expect(
        screen.getByText(String(mockSubscriptions.length))
      ).toBeInTheDocument()
    })

    it('renders each subscription', () => {
      render(<SubredditManager {...baseProps} />)

      expect(screen.getByText('r/programming')).toBeInTheDocument()
      expect(screen.getByText('r/javascript')).toBeInTheDocument()
    })

    it('renders leave buttons for each subscription', () => {
      render(<SubredditManager {...baseProps} />)

      const leaveButtons = screen.getAllByRole('button', {name: /leave r\//i})
      expect(leaveButtons).toHaveLength(mockSubscriptions.length)
    })

    it('shows empty state when no subscriptions', () => {
      render(<SubredditManager {...baseProps} subscriptions={[]} />)

      expect(
        screen.getByText(/No subreddit subscriptions yet/i)
      ).toBeInTheDocument()
    })
  })

  describe('leaving a subreddit', () => {
    it('calls toggleSubscription unsub when leave button clicked', async () => {
      const user = userEvent.setup()
      render(<SubredditManager {...baseProps} />)

      const leaveBtn = screen.getByRole('button', {
        name: /leave r\/programming/i
      })
      await user.click(leaveBtn)

      await waitFor(() => {
        expect(mockToggle).toHaveBeenCalledWith('programming', 'unsub')
      })
    })

    it('optimistically removes subscription from list', async () => {
      const user = userEvent.setup()
      render(<SubredditManager {...baseProps} />)

      const leaveBtn = screen.getByRole('button', {
        name: /leave r\/programming/i
      })
      await user.click(leaveBtn)

      await waitFor(() => {
        expect(screen.queryByText('r/programming')).not.toBeInTheDocument()
      })
    })

    it('shows error and restores subscription on failure', async () => {
      mockToggle.mockResolvedValueOnce({
        success: false,
        error: 'Failed to unsubscribe'
      })

      const user = userEvent.setup()
      render(<SubredditManager {...baseProps} />)

      await user.click(
        screen.getByRole('button', {name: /leave r\/programming/i})
      )

      await waitFor(() => {
        expect(screen.getByText('Failed to unsubscribe')).toBeInTheDocument()
      })

      // Subscription should be restored
      expect(screen.getByText('r/programming')).toBeInTheDocument()
    })

    it('dismisses error when close button clicked', async () => {
      mockToggle.mockResolvedValueOnce({
        success: false,
        error: 'Failed to unsubscribe'
      })

      const user = userEvent.setup()
      render(<SubredditManager {...baseProps} />)

      await user.click(
        screen.getByRole('button', {name: /leave r\/programming/i})
      )

      await waitFor(() => {
        expect(screen.getByText('Failed to unsubscribe')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('dismiss-error-btn'))

      await waitFor(() => {
        expect(
          screen.queryByText('Failed to unsubscribe')
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('search autocomplete', () => {
    it('shows search results when typing', async () => {
      mockSearch.mockResolvedValue({
        success: true,
        data: [
          {
            name: 'typescript',
            displayName: 'r/typescript',
            icon: '',
            subscribers: 5000,
            over18: false,
            type: 'subreddit' as const
          }
        ]
      })

      const user = userEvent.setup()
      render(<SubredditManager {...baseProps} />)

      await user.type(
        screen.getByRole('textbox', {name: /search subreddits/i}),
        'ty'
      )

      await waitFor(() => {
        expect(screen.getByText('r/typescript')).toBeInTheDocument()
      })
    })

    it('filters out user results from search', async () => {
      mockSearch.mockResolvedValue({
        success: true,
        data: [
          {
            name: 'typescript',
            displayName: 'r/typescript',
            icon: '',
            subscribers: 5000,
            over18: false,
            type: 'subreddit' as const
          },
          {
            name: 'testuser',
            displayName: 'u/testuser',
            icon: '',
            subscribers: 100,
            over18: false,
            type: 'user' as const
          }
        ]
      })

      const user = userEvent.setup()
      render(<SubredditManager {...baseProps} />)

      await user.type(
        screen.getByRole('textbox', {name: /search subreddits/i}),
        'te'
      )

      await waitFor(() => {
        expect(screen.getByText('r/typescript')).toBeInTheDocument()
      })

      // User result should NOT appear
      expect(screen.queryByText('u/testuser')).not.toBeInTheDocument()
    })

    it('joins subreddit when selecting unsubscribed result', async () => {
      mockSearch.mockResolvedValue({
        success: true,
        data: [
          {
            name: 'typescript',
            displayName: 'r/typescript',
            icon: '',
            subscribers: 5000,
            over18: false,
            type: 'subreddit' as const
          }
        ]
      })

      const user = userEvent.setup()
      render(<SubredditManager {...baseProps} />)

      await user.type(
        screen.getByRole('textbox', {name: /search subreddits/i}),
        'ty'
      )

      const option = await screen.findByText('r/typescript')
      await user.click(option)

      await waitFor(() => {
        expect(mockToggle).toHaveBeenCalledWith('typescript', 'sub')
      })
    })

    it('shows leave button for already-subscribed result', async () => {
      mockSearch.mockResolvedValue({
        success: true,
        data: [
          {
            name: 'programming',
            displayName: 'r/programming',
            icon: '',
            subscribers: 10000,
            over18: false,
            type: 'subreddit' as const
          }
        ]
      })

      const user = userEvent.setup()
      render(<SubredditManager {...baseProps} />)

      await user.type(
        screen.getByRole('textbox', {name: /search subreddits/i}),
        'prog'
      )

      await waitFor(() => {
        // In search results, show leave button for already-subscribed
        const leaveButtons = screen.getAllByRole('button', {
          name: /leave r\/programming/i
        })
        expect(leaveButtons.length).toBeGreaterThan(0)
      })
    })
  })
})
