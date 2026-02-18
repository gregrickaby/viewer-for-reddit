import {
  addSubredditToMultireddit,
  createMultireddit,
  deleteMultireddit,
  removeSubredditFromMultireddit,
  searchSubredditsAndUsers,
  updateMultiredditName
} from '@/lib/actions/reddit'
import {render, screen, waitFor} from '@/test-utils'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {MultiredditManager} from './MultiredditManager'

vi.mock('@/lib/actions/reddit', () => ({
  createMultireddit: vi.fn(async () => ({
    success: true,
    path: '/user/testuser/m/new_multi'
  })),
  deleteMultireddit: vi.fn(async () => ({success: true})),
  updateMultiredditName: vi.fn(async () => ({success: true})),
  addSubredditToMultireddit: vi.fn(async () => ({success: true})),
  removeSubredditFromMultireddit: vi.fn(async () => ({success: true})),
  searchSubredditsAndUsers: vi.fn(async () => ({success: true, data: []}))
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: {error: vi.fn()}
}))

const mockCreate = vi.mocked(createMultireddit)
const mockDelete = vi.mocked(deleteMultireddit)
const mockRename = vi.mocked(updateMultiredditName)
const mockAddSub = vi.mocked(addSubredditToMultireddit)
const mockRemoveSub = vi.mocked(removeSubredditFromMultireddit)
const mockSearch = vi.mocked(searchSubredditsAndUsers)

const mockMultireddits = [
  {
    name: 'tech',
    displayName: 'Tech News',
    path: '/user/testuser/m/tech',
    subreddits: ['programming', 'javascript']
  },
  {
    name: 'gaming',
    displayName: 'Gaming',
    path: '/user/testuser/m/gaming',
    subreddits: []
  }
]

const baseProps = {
  opened: true,
  onClose: vi.fn(),
  multireddits: mockMultireddits
}

describe('MultiredditManager', () => {
  beforeEach(() => {
    mockCreate.mockClear()
    mockDelete.mockClear()
    mockRename.mockClear()
    mockAddSub.mockClear()
    mockRemoveSub.mockClear()
    mockSearch.mockClear()

    mockCreate.mockResolvedValue({
      success: true,
      path: '/user/testuser/m/new_multi'
    })
    mockDelete.mockResolvedValue({success: true})
    mockRename.mockResolvedValue({success: true})
    mockAddSub.mockResolvedValue({success: true})
    mockRemoveSub.mockResolvedValue({success: true})
    mockSearch.mockResolvedValue({success: true, data: []})
  })

  describe('rendering', () => {
    it('renders the drawer when opened', () => {
      render(<MultiredditManager {...baseProps} />)

      expect(screen.getByText('Manage Multireddits')).toBeInTheDocument()
    })

    it('does not render drawer content when closed', () => {
      render(<MultiredditManager {...baseProps} opened={false} />)

      expect(screen.queryByText('Manage Multireddits')).not.toBeInTheDocument()
    })

    it('renders create section', () => {
      render(<MultiredditManager {...baseProps} />)

      expect(screen.getByText('Create New Multireddit')).toBeInTheDocument()
      expect(screen.getByLabelText(/url name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
      expect(screen.getByRole('button', {name: /create/i})).toBeInTheDocument()
    })

    it('renders multireddits count', () => {
      render(<MultiredditManager {...baseProps} />)

      expect(
        screen.getByText(`Your Multireddits (${mockMultireddits.length})`)
      ).toBeInTheDocument()
    })

    it('renders each multireddit accordion item', () => {
      render(<MultiredditManager {...baseProps} />)

      expect(screen.getByText('Tech News')).toBeInTheDocument()
      expect(screen.getByText('Gaming')).toBeInTheDocument()
    })

    it('shows empty state when no multireddits', () => {
      render(<MultiredditManager {...baseProps} multireddits={[]} />)

      expect(
        screen.getByText('No multireddits yet. Create one above!')
      ).toBeInTheDocument()
    })

    it('disables create button when fields are empty', () => {
      render(<MultiredditManager {...baseProps} />)

      const createButton = screen.getByRole('button', {name: /create/i})
      expect(createButton).toBeDisabled()
    })
  })

  describe('creating multireddits', () => {
    it('enables create button when both fields have content', async () => {
      const user = userEvent.setup()
      render(<MultiredditManager {...baseProps} />)

      const nameInput = screen.getByPlaceholderText('my_multi')
      const displayInput = screen.getByPlaceholderText('My Tech Feed')

      await user.type(nameInput, 'my_multi')
      await user.type(displayInput, 'My Multi')

      const createButton = screen.getByRole('button', {name: /create/i})
      expect(createButton).toBeEnabled()
    })

    it('calls create action when form is submitted', async () => {
      const user = userEvent.setup()
      render(<MultiredditManager {...baseProps} />)

      await user.type(screen.getByPlaceholderText('my_multi'), 'new_multi')
      await user.type(screen.getByPlaceholderText('My Tech Feed'), 'New Multi')
      await user.click(screen.getByRole('button', {name: /create/i}))

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith('new_multi', 'New Multi')
      })
    })

    it('clears fields after successful create', async () => {
      const user = userEvent.setup()
      render(<MultiredditManager {...baseProps} multireddits={[]} />)

      const nameInput = screen.getByPlaceholderText('my_multi')
      const displayInput = screen.getByPlaceholderText('My Tech Feed')

      await user.type(nameInput, 'new_multi')
      await user.type(displayInput, 'New Multi')
      await user.click(screen.getByRole('button', {name: /create/i}))

      await waitFor(() => {
        expect((nameInput as HTMLInputElement).value).toBe('')
        expect((displayInput as HTMLInputElement).value).toBe('')
      })
    })

    it('supports Enter key to submit', async () => {
      const user = userEvent.setup()
      render(<MultiredditManager {...baseProps} />)

      await user.type(screen.getByPlaceholderText('my_multi'), 'new_multi')
      await user.type(
        screen.getByPlaceholderText('My Tech Feed'),
        'New Multi{Enter}'
      )

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith('new_multi', 'New Multi')
      })
    })
  })

  describe('accordion interactions', () => {
    it('shows subreddits when accordion item is expanded', async () => {
      const user = userEvent.setup()
      render(<MultiredditManager {...baseProps} />)

      // Click the Tech News accordion
      const techAccordion = screen.getByRole('button', {name: /tech news/i})
      await user.click(techAccordion)

      await waitFor(() => {
        expect(screen.getByText('r/programming')).toBeInTheDocument()
        expect(screen.getByText('r/javascript')).toBeInTheDocument()
      })
    })

    it('shows empty subreddits message when none exist', async () => {
      const user = userEvent.setup()
      render(<MultiredditManager {...baseProps} />)

      // Click the Gaming accordion (has no subreddits)
      const gamingAccordion = screen.getByRole('button', {name: /gaming/i})
      await user.click(gamingAccordion)

      await waitFor(() => {
        expect(screen.getByText('None added yet.')).toBeInTheDocument()
      })
    })

    it('shows rename and delete buttons when expanded', async () => {
      const user = userEvent.setup()
      render(<MultiredditManager {...baseProps} />)

      await user.click(screen.getByRole('button', {name: /tech news/i}))

      await waitFor(() => {
        expect(
          screen.getByRole('button', {name: /rename tech news/i})
        ).toBeInTheDocument()
        expect(
          screen.getByRole('button', {name: /delete tech news/i})
        ).toBeInTheDocument()
      })
    })

    it('shows add subreddit input when expanded', async () => {
      const user = userEvent.setup()
      render(<MultiredditManager {...baseProps} />)

      await user.click(screen.getByRole('button', {name: /tech news/i}))

      await waitFor(() => {
        expect(
          screen.getAllByLabelText('Add subreddit to multireddit')[0]
        ).toBeInTheDocument()
      })
    })
  })

  describe('rename', () => {
    it('shows rename input when edit button clicked', async () => {
      const user = userEvent.setup()
      render(<MultiredditManager {...baseProps} />)

      await user.click(screen.getByRole('button', {name: /tech news/i}))

      await waitFor(() => {
        expect(
          screen.getByRole('button', {name: /rename tech news/i})
        ).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', {name: /rename tech news/i}))

      expect(screen.getByLabelText('New display name')).toBeInTheDocument()
    })

    it('calls rename action when name is saved', async () => {
      const user = userEvent.setup()
      render(<MultiredditManager {...baseProps} />)

      await user.click(screen.getByRole('button', {name: /tech news/i}))

      await waitFor(() => {
        expect(
          screen.getByRole('button', {name: /rename tech news/i})
        ).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', {name: /rename tech news/i}))

      const input = screen.getByLabelText('New display name')
      await user.clear(input)
      await user.type(input, 'Updated Tech')

      await user.click(screen.getByRole('button', {name: /save name/i}))

      await waitFor(() => {
        expect(mockRename).toHaveBeenCalledWith(
          '/user/testuser/m/tech',
          'Updated Tech'
        )
      })
    })
  })

  describe('delete', () => {
    it('calls delete action when delete button clicked', async () => {
      const user = userEvent.setup()
      render(<MultiredditManager {...baseProps} />)

      await user.click(screen.getByRole('button', {name: /tech news/i}))

      await waitFor(() => {
        expect(
          screen.getByRole('button', {name: /delete tech news/i})
        ).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', {name: /delete tech news/i}))

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith('/user/testuser/m/tech')
      })
    })
  })

  describe('add subreddit', () => {
    it('calls addSubreddit when add button clicked', async () => {
      const user = userEvent.setup()
      render(<MultiredditManager {...baseProps} />)

      await user.click(screen.getByRole('button', {name: /tech news/i}))

      const input = await screen.findAllByLabelText(
        'Add subreddit to multireddit'
      )

      await user.type(input[0], 'typescript')
      await user.click(
        screen.getAllByRole('button', {name: 'Add subreddit'})[0]
      )

      await waitFor(() => {
        expect(mockAddSub).toHaveBeenCalledWith(
          '/user/testuser/m/tech',
          'typescript'
        )
      })
    })

    it('supports Enter key to add subreddit', async () => {
      const user = userEvent.setup()
      render(<MultiredditManager {...baseProps} />)

      await user.click(screen.getByRole('button', {name: /tech news/i}))

      const inputs = await screen.findAllByLabelText(
        'Add subreddit to multireddit'
      )

      await user.type(inputs[0], 'typescript{Enter}')

      await waitFor(() => {
        expect(mockAddSub).toHaveBeenCalledWith(
          '/user/testuser/m/tech',
          'typescript'
        )
      })
    })

    it('strips r/ prefix before adding', async () => {
      const user = userEvent.setup()
      render(<MultiredditManager {...baseProps} />)

      await user.click(screen.getByRole('button', {name: /tech news/i}))

      const inputs = await screen.findAllByLabelText(
        'Add subreddit to multireddit'
      )

      await user.type(inputs[0], 'r/typescript{Enter}')

      await waitFor(() => {
        expect(mockAddSub).toHaveBeenCalledWith(
          '/user/testuser/m/tech',
          'typescript'
        )
      })
    })

    it('strips u/ prefix before adding user', async () => {
      const user = userEvent.setup()
      render(<MultiredditManager {...baseProps} />)

      await user.click(screen.getByRole('button', {name: /tech news/i}))

      const inputs = await screen.findAllByLabelText(
        'Add subreddit to multireddit'
      )

      await user.type(inputs[0], 'u/someuser{Enter}')

      await waitFor(() => {
        expect(mockAddSub).toHaveBeenCalledWith(
          '/user/testuser/m/tech',
          'someuser'
        )
      })
    })

    it('shows autocomplete results when typing', async () => {
      mockSearch.mockResolvedValue({
        success: true,
        data: [
          {
            name: 'typescript',
            displayName: 'r/typescript',
            icon: '',
            subscribers: 1000,
            over18: false,
            type: 'subreddit' as const
          },
          {
            name: 'testuser',
            displayName: 'u/testuser',
            icon: '',
            subscribers: 50,
            over18: false,
            type: 'user' as const
          }
        ]
      })

      const user = userEvent.setup()
      render(<MultiredditManager {...baseProps} />)

      await user.click(screen.getByRole('button', {name: /tech news/i}))

      const inputs = await screen.findAllByLabelText(
        'Add subreddit to multireddit'
      )

      await user.type(inputs[0], 'ty')

      await waitFor(() => {
        expect(screen.getByText('r/typescript')).toBeInTheDocument()
      })

      expect(screen.getByText('u/testuser')).toBeInTheDocument()
    })

    it('adds subreddit when autocomplete option is selected', async () => {
      mockSearch.mockResolvedValue({
        success: true,
        data: [
          {
            name: 'typescript',
            displayName: 'r/typescript',
            icon: '',
            subscribers: 1000,
            over18: false,
            type: 'subreddit' as const
          }
        ]
      })

      const user = userEvent.setup()
      render(<MultiredditManager {...baseProps} />)

      await user.click(screen.getByRole('button', {name: /tech news/i}))

      const inputs = await screen.findAllByLabelText(
        'Add subreddit to multireddit'
      )

      await user.type(inputs[0], 'ty')

      const option = await screen.findByText('r/typescript')
      await user.click(option)

      await waitFor(() => {
        expect(mockAddSub).toHaveBeenCalledWith(
          '/user/testuser/m/tech',
          'typescript'
        )
      })
    })
  })

  describe('remove subreddit', () => {
    it('calls removeSubreddit when X button clicked', async () => {
      const user = userEvent.setup()
      render(<MultiredditManager {...baseProps} />)

      await user.click(screen.getByRole('button', {name: /tech news/i}))

      await waitFor(() => {
        expect(
          screen.getByRole('button', {name: /remove r\/programming/i})
        ).toBeInTheDocument()
      })

      await user.click(
        screen.getByRole('button', {name: /remove r\/programming/i})
      )

      await waitFor(() => {
        expect(mockRemoveSub).toHaveBeenCalledWith(
          '/user/testuser/m/tech',
          'programming'
        )
      })
    })
  })

  describe('error handling', () => {
    it('shows error alert on failure', async () => {
      mockDelete.mockResolvedValueOnce({success: false, error: 'Delete failed'})
      const user = userEvent.setup()
      render(<MultiredditManager {...baseProps} />)

      await user.click(screen.getByRole('button', {name: /tech news/i}))

      await waitFor(() => {
        expect(
          screen.getByRole('button', {name: /delete tech news/i})
        ).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', {name: /delete tech news/i}))

      await waitFor(() => {
        expect(screen.getByText('Delete failed')).toBeInTheDocument()
      })
    })

    it('dismisses error alert when close button clicked', async () => {
      mockDelete.mockResolvedValueOnce({success: false, error: 'Delete failed'})
      const user = userEvent.setup()
      render(<MultiredditManager {...baseProps} />)

      await user.click(screen.getByRole('button', {name: /tech news/i}))

      await waitFor(() => {
        expect(
          screen.getByRole('button', {name: /delete tech news/i})
        ).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', {name: /delete tech news/i}))

      await waitFor(() => {
        expect(screen.getByText('Delete failed')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('dismiss-error-btn'))

      await waitFor(() => {
        expect(screen.queryByText('Delete failed')).not.toBeInTheDocument()
      })
    })
  })
})
