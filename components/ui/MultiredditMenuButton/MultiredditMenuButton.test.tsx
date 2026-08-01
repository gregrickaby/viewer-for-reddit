import {render, screen, user, waitFor} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {MultiredditMenuButton} from './MultiredditMenuButton'

const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({refresh: mockRefresh}))
}))

const mockMultireddits = [
  {
    name: 'tech',
    displayName: 'Tech News',
    path: '/user/testuser/m/tech',
    subreddits: ['programming']
  },
  {
    name: 'gaming',
    displayName: 'Gaming',
    path: '/user/testuser/m/gaming',
    subreddits: []
  }
]

describe('MultiredditMenuButton', () => {
  beforeEach(() => {
    mockRefresh.mockClear()
  })

  it('renders nothing when multireddits is empty', () => {
    render(
      <MultiredditMenuButton
        multireddits={[]}
        menuLabel="Your Multireddits"
        triggerLabel="Add to multireddit"
        isInMulti={() => false}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />
    )

    expect(
      screen.queryByRole('button', {name: /add to multireddit/i})
    ).not.toBeInTheDocument()
  })

  it('renders the trigger and opens the menu with multireddit options', async () => {
    render(
      <MultiredditMenuButton
        multireddits={mockMultireddits}
        menuLabel="Your Multireddits"
        triggerLabel="Add to multireddit"
        isInMulti={() => false}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', {name: /add to multireddit/i}))

    expect(await screen.findByText('Tech News')).toBeInTheDocument()
    expect(screen.getByText('Gaming')).toBeInTheDocument()
  })

  it('calls onAdd when selecting a multireddit that does not contain the target', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined)
    render(
      <MultiredditMenuButton
        multireddits={mockMultireddits}
        menuLabel="Your Multireddits"
        triggerLabel="Add to multireddit"
        isInMulti={() => false}
        onAdd={onAdd}
        onRemove={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', {name: /add to multireddit/i}))
    await user.click(await screen.findByText('Tech News'))

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith('/user/testuser/m/tech')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('calls onRemove when selecting a multireddit that already contains the target', async () => {
    const onRemove = vi.fn().mockResolvedValue(undefined)
    render(
      <MultiredditMenuButton
        multireddits={mockMultireddits}
        menuLabel="Your Multireddits"
        triggerLabel="Add to multireddit"
        isInMulti={(multi) => multi.name === 'tech'}
        onAdd={vi.fn()}
        onRemove={onRemove}
      />
    )

    await user.click(screen.getByRole('button', {name: /add to multireddit/i}))
    await user.click(await screen.findByText('Tech News'))

    await waitFor(() => {
      expect(onRemove).toHaveBeenCalledWith('/user/testuser/m/tech')
    })
  })

  it('disables the trigger while a toggle is pending', async () => {
    const onAdd = vi.fn(() => new Promise(() => {}))
    render(
      <MultiredditMenuButton
        multireddits={mockMultireddits}
        menuLabel="Your Multireddits"
        triggerLabel="Add to multireddit"
        isInMulti={() => false}
        onAdd={onAdd}
        onRemove={vi.fn()}
      />
    )

    const trigger = screen.getByRole('button', {name: /add to multireddit/i})
    await user.click(trigger)
    await user.click(await screen.findByText('Tech News'))

    await waitFor(() => {
      expect(trigger).toBeDisabled()
    })
  })
})
