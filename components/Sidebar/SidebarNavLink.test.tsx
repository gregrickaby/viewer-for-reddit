import {SidebarNavLink} from '@/components/Sidebar/SidebarNavLink'
import {render, screen} from '@/test-utils'
import userEvent from '@testing-library/user-event'

const {mockUseHeaderState} = vi.hoisted(() => ({
  mockUseHeaderState: vi.fn()
}))
vi.mock('@/lib/hooks/useHeaderState', () => ({
  useHeaderState: () => mockUseHeaderState()
}))

vi.mock('@/components/SubredditName/SubredditName', () => ({
  SubredditName: (props: any) => (
    <div data-testid="subreddit-name">{props.name}</div>
  )
}))

vi.mock('@mantine/core', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    NavLink: ({label, onClick, href}: any) => (
      <a
        href={href}
        onClick={(e) => {
          e.preventDefault()
          onClick?.(e)
        }}
      >
        {label}
      </a>
    )
  }
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SidebarNavLink', () => {
  it('calls toggle when navbar is shown', async () => {
    const user = userEvent.setup()
    const toggle = vi.fn()
    mockUseHeaderState.mockReturnValue({
      showNavbar: true,
      toggleNavbarHandler: toggle
    })
    render(<SidebarNavLink name="test" icon="i" />)
    await user.click(screen.getByRole('link'))
    expect(toggle).toHaveBeenCalled()
  })

  it('does not call toggle when navbar hidden', async () => {
    const user = userEvent.setup()
    const toggle = vi.fn()
    mockUseHeaderState.mockReturnValue({
      showNavbar: false,
      toggleNavbarHandler: toggle
    })
    render(<SidebarNavLink name="test" icon="i" />)
    await user.click(screen.getByRole('link'))
    expect(toggle).not.toHaveBeenCalled()
  })
})
