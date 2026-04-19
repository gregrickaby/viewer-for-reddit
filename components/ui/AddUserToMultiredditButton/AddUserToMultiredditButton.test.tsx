import {
  addUserToMultireddit,
  removeUserFromMultireddit
} from '@/lib/actions/reddit/multireddits'
import {render, screen, waitFor} from '@/test-utils'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {AddUserToMultiredditButton} from './AddUserToMultiredditButton'

const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({refresh: mockRefresh}))
}))

vi.mock('@/lib/actions/reddit/multireddits', () => ({
  addUserToMultireddit: vi.fn(async () => ({success: true})),
  removeUserFromMultireddit: vi.fn(async () => ({success: true}))
}))

const mockAdd = vi.mocked(addUserToMultireddit)
const mockRemove = vi.mocked(removeUserFromMultireddit)

const mockMultireddits = [
  {
    name: 'tech',
    displayName: 'Tech News',
    path: '/user/testuser/m/tech',
    subreddits: ['programming', 'u_someuser']
  },
  {
    name: 'gaming',
    displayName: 'Gaming',
    path: '/user/testuser/m/gaming',
    subreddits: []
  }
]

describe('AddUserToMultiredditButton', () => {
  beforeEach(() => {
    mockAdd.mockClear()
    mockRemove.mockClear()
    mockRefresh.mockClear()
    mockAdd.mockResolvedValue({success: true})
    mockRemove.mockResolvedValue({success: true})
  })

  describe('rendering', () => {
    it('renders the button when multireddits exist', () => {
      render(
        <AddUserToMultiredditButton
          username="johndoe"
          multireddits={mockMultireddits}
        />
      )

      expect(
        screen.getByRole('button', {name: /add to custom feed/i})
      ).toBeInTheDocument()
    })

    it('renders nothing when multireddits is empty', () => {
      render(
        <AddUserToMultiredditButton username="johndoe" multireddits={[]} />
      )

      expect(
        screen.queryByRole('button', {name: /add to custom feed/i})
      ).not.toBeInTheDocument()
    })

    it('opens menu and shows custom feeds list', async () => {
      const user = userEvent.setup()
      render(
        <AddUserToMultiredditButton
          username="johndoe"
          multireddits={mockMultireddits}
        />
      )

      await user.click(
        screen.getByRole('button', {name: /add to custom feed/i})
      )

      await waitFor(() => {
        expect(screen.getByText('Tech News')).toBeInTheDocument()
        expect(screen.getByText('Gaming')).toBeInTheDocument()
      })
    })

    it('is case-insensitive when checking membership', async () => {
      const user = userEvent.setup()
      // "someuser" maps to "u_someuser" which is in tech's subreddits
      render(
        <AddUserToMultiredditButton
          username="SomeUser"
          multireddits={mockMultireddits}
        />
      )

      await user.click(
        screen.getByRole('button', {name: /add to custom feed/i})
      )

      const techNewsItem = await screen.findByText('Tech News')
      await user.click(techNewsItem)

      await waitFor(() => {
        expect(mockRemove).toHaveBeenCalledWith(
          '/user/testuser/m/tech',
          'SomeUser'
        )
        expect(mockAdd).not.toHaveBeenCalled()
      })
    })
  })

  describe('interactions', () => {
    it('calls addUserToMultireddit when adding to a feed', async () => {
      const user = userEvent.setup()
      render(
        <AddUserToMultiredditButton
          username="johndoe"
          multireddits={mockMultireddits}
        />
      )

      await user.click(
        screen.getByRole('button', {name: /add to custom feed/i})
      )
      await user.click(await screen.findByText('Tech News'))

      await waitFor(() => {
        expect(mockAdd).toHaveBeenCalledWith('/user/testuser/m/tech', 'johndoe')
      })
    })

    it('calls removeUserFromMultireddit when removing from a feed', async () => {
      const user = userEvent.setup()
      // "someuser" maps to "u_someuser" which is in tech's subreddits
      render(
        <AddUserToMultiredditButton
          username="someuser"
          multireddits={mockMultireddits}
        />
      )

      await user.click(
        screen.getByRole('button', {name: /add to custom feed/i})
      )
      await user.click(await screen.findByText('Tech News'))

      await waitFor(() => {
        expect(mockRemove).toHaveBeenCalledWith(
          '/user/testuser/m/tech',
          'someuser'
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
        <AddUserToMultiredditButton
          username="johndoe"
          multireddits={mockMultireddits}
        />
      )

      const triggerBtn = screen.getByRole('button', {
        name: /add to custom feed/i
      })
      await user.click(triggerBtn)
      await user.click(await screen.findByText('Tech News'))

      expect(triggerBtn).toBeDisabled()
    })
  })
})
