import {render, screen, user} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {ManagerDrawer} from './ManagerDrawer'

describe('ManagerDrawer', () => {
  it('renders the title and children when opened', () => {
    render(
      <ManagerDrawer
        opened
        onClose={vi.fn()}
        title="Manage Subreddits"
        error={null}
        onDismissError={vi.fn()}
      >
        <div>drawer body</div>
      </ManagerDrawer>
    )

    expect(screen.getByText('Manage Subreddits')).toBeInTheDocument()
    expect(screen.getByText('drawer body')).toBeInTheDocument()
  })

  it('does not render drawer content when closed', () => {
    render(
      <ManagerDrawer
        opened={false}
        onClose={vi.fn()}
        title="Manage Subreddits"
        error={null}
        onDismissError={vi.fn()}
      >
        <div>drawer body</div>
      </ManagerDrawer>
    )

    expect(screen.queryByText('Manage Subreddits')).not.toBeInTheDocument()
  })

  it('renders the error alert and dismiss button when error is set', async () => {
    const onDismissError = vi.fn()
    render(
      <ManagerDrawer
        opened
        onClose={vi.fn()}
        title="Manage Subreddits"
        error="Something went wrong"
        onDismissError={onDismissError}
      >
        <div>drawer body</div>
      </ManagerDrawer>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    await user.click(screen.getByTestId('dismiss-error-btn'))

    expect(onDismissError).toHaveBeenCalledTimes(1)
  })

  it('does not render the error alert when error is null', () => {
    render(
      <ManagerDrawer
        opened
        onClose={vi.fn()}
        title="Manage Subreddits"
        error={null}
        onDismissError={vi.fn()}
      >
        <div>drawer body</div>
      </ManagerDrawer>
    )

    expect(screen.queryByTestId('dismiss-error-btn')).not.toBeInTheDocument()
  })
})
