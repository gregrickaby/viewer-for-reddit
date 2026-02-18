import {
  addSubredditToMultireddit,
  removeSubredditFromMultireddit
} from '@/lib/actions/reddit'
import {render, screen, waitFor} from '@/test-utils'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {AddToMultiredditButton} from './AddToMultiredditButton'

vi.mock('@/lib/actions/reddit', () => ({
  addSubredditToMultireddit: vi.fn(async () => ({success: true})),
  removeSubredditFromMultireddit: vi.fn(async () => ({success: true}))
}))

const mockAdd = vi.mocked(addSubredditToMultireddit)
const mockRemove = vi.mocked(removeSubredditFromMultireddit)

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

describe('AddToMultiredditButton', () => {
  beforeEach(() => {
    mockAdd.mockClear()
    mockRemove.mockClear()
    mockAdd.mockResolvedValue({success: true})
    mockRemove.mockResolvedValue({success: true})
  })

  describe('rendering', () => {
    it('renders the button when multireddits exist', () => {
      render(
        <AddToMultiredditButton
          subredditName="typescript"
          multireddits={mockMultireddits}
        />
      )

      expect(
        screen.getByRole('button', {name: /add to multireddit/i})
      ).toBeInTheDocument()
    })

    it('renders nothing when multireddits is empty', () => {
      render(
        <AddToMultiredditButton subredditName="typescript" multireddits={[]} />
      )

      expect(
        screen.queryByRole('button', {name: /add to multireddit/i})
      ).not.toBeInTheDocument()
    })

    it('opens menu and shows multireddit list', async () => {
      const user = userEvent.setup()
      render(
        <AddToMultiredditButton
          subredditName="typescript"
          multireddits={mockMultireddits}
        />
      )

      await user.click(
        screen.getByRole('button', {name: /add to multireddit/i})
      )

      await waitFor(() => {
        expect(screen.getByText('Tech News')).toBeInTheDocument()
        expect(screen.getByText('Gaming')).toBeInTheDocument()
      })
    })

    it('is case-insensitive when checking membership', async () => {
      const user = userEvent.setup()
      render(
        <AddToMultiredditButton
          subredditName="Programming"
          multireddits={mockMultireddits}
        />
      )

      await user.click(
        screen.getByRole('button', {name: /add to multireddit/i})
      )

      // "Programming" matches "programming" case-insensitively, so Tech News item
      // should trigger removeSubredditFromMultireddit, not add
      const techNewsItem = await screen.findByText('Tech News')
      await user.click(techNewsItem)

      await waitFor(() => {
        expect(mockRemove).toHaveBeenCalledWith(
          '/user/testuser/m/tech',
          'Programming'
        )
        expect(mockAdd).not.toHaveBeenCalled()
      })
    })
  })

  describe('interactions', () => {
    it('calls addSubredditToMultireddit when adding to a multi', async () => {
      const user = userEvent.setup()
      render(
        <AddToMultiredditButton
          subredditName="typescript"
          multireddits={mockMultireddits}
        />
      )

      await user.click(
        screen.getByRole('button', {name: /add to multireddit/i})
      )
      await user.click(await screen.findByText('Tech News'))

      await waitFor(() => {
        expect(mockAdd).toHaveBeenCalledWith(
          '/user/testuser/m/tech',
          'typescript'
        )
      })
    })

    it('calls removeSubredditFromMultireddit when removing from a multi', async () => {
      const user = userEvent.setup()
      render(
        <AddToMultiredditButton
          subredditName="programming"
          multireddits={mockMultireddits}
        />
      )

      await user.click(
        screen.getByRole('button', {name: /add to multireddit/i})
      )
      // "programming" is in tech's subreddits, so clicking Tech News removes it
      await user.click(await screen.findByText('Tech News'))

      await waitFor(() => {
        expect(mockRemove).toHaveBeenCalledWith(
          '/user/testuser/m/tech',
          'programming'
        )
      })
    })

    it('disables the trigger button while pending', async () => {
      const user = userEvent.setup()
      mockAdd.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({success: true}), 500)
          )
      )

      render(
        <AddToMultiredditButton
          subredditName="typescript"
          multireddits={mockMultireddits}
        />
      )

      const triggerBtn = screen.getByRole('button', {
        name: /add to multireddit/i
      })
      await user.click(triggerBtn)
      await user.click(await screen.findByText('Tech News'))

      expect(triggerBtn).toBeDisabled()
    })
  })
})
