import {render, screen, user, waitFor} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {MultiredditMenuButton} from './MultiredditMenuButton'

const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({refresh: mockRefresh}))
}))

// Forces the isPending branch of handleToggle's race-condition guard
// without racing real React transition timing.
let mockIsPending = false
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useTransition: () => [mockIsPending, (callback: () => void) => callback()]
  }
})

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
    mockIsPending = false
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

  it('disables the trigger while a toggle is pending', () => {
    mockIsPending = true
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

    expect(
      screen.getByRole('button', {name: /add to multireddit/i})
    ).toBeDisabled()
  })

  it('ignores a selection if isPending flips true after the menu opens', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined)
    const {rerender} = render(
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
    const techNews = await screen.findByText('Tech News')

    mockIsPending = true
    rerender(
      <MultiredditMenuButton
        multireddits={mockMultireddits}
        menuLabel="Your Multireddits"
        triggerLabel="Add to multireddit"
        isInMulti={() => false}
        onAdd={onAdd}
        onRemove={vi.fn()}
      />
    )

    await user.click(techNews)

    expect(onAdd).not.toHaveBeenCalled()
    expect(mockRefresh).not.toHaveBeenCalled()
  })
})
