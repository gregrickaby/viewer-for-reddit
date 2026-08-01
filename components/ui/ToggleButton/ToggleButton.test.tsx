import {render, screen, user} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {ToggleButton} from './ToggleButton'

const baseProps = {
  activeLabel: 'Following',
  inactiveLabel: 'Follow',
  activeIcon: <span data-testid="active-icon" />,
  inactiveIcon: <span data-testid="inactive-icon" />,
  activeAriaLabel: 'Unfollow testuser',
  inactiveAriaLabel: 'Follow testuser'
}

describe('ToggleButton', () => {
  it('renders the inactive label, icon, and aria-label when not active', () => {
    render(
      <ToggleButton
        {...baseProps}
        active={false}
        isPending={false}
        onToggle={vi.fn()}
      />
    )

    expect(
      screen.getByRole('button', {name: 'Follow testuser'})
    ).toBeInTheDocument()
    expect(screen.getByText('Follow')).toBeInTheDocument()
    expect(screen.getByTestId('inactive-icon')).toBeInTheDocument()
  })

  it('renders the active label, icon, and aria-label when active', () => {
    render(
      <ToggleButton
        {...baseProps}
        active
        isPending={false}
        onToggle={vi.fn()}
      />
    )

    expect(
      screen.getByRole('button', {name: 'Unfollow testuser'})
    ).toBeInTheDocument()
    expect(screen.getByText('Following')).toBeInTheDocument()
    expect(screen.getByTestId('active-icon')).toBeInTheDocument()
  })

  it('calls onToggle when clicked', async () => {
    const onToggle = vi.fn()
    render(
      <ToggleButton
        {...baseProps}
        active={false}
        isPending={false}
        onToggle={onToggle}
      />
    )

    await user.click(screen.getByRole('button', {name: 'Follow testuser'}))

    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('is disabled while pending', () => {
    render(
      <ToggleButton
        {...baseProps}
        active={false}
        isPending
        onToggle={vi.fn()}
      />
    )

    expect(screen.getByRole('button', {name: 'Follow testuser'})).toBeDisabled()
  })
})
