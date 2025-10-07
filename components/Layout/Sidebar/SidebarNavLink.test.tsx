import {SidebarNavLink} from '@/components/Layout/Sidebar/SidebarNavLink'
import {render, screen} from '@/test-utils'
import userEvent from '@testing-library/user-event'

const {mockUseHeaderState} = vi.hoisted(() => ({
  mockUseHeaderState: vi.fn()
}))
vi.mock('@/lib/hooks/useHeaderState', () => ({
  useHeaderState: () => mockUseHeaderState()
}))

vi.mock('@/components/UI/SubredditName/SubredditName', () => ({
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
  it('calls mobile toggle handler when clicked', async () => {
    const user = userEvent.setup()
    const toggleOnMobile = vi.fn()
    mockUseHeaderState.mockReturnValue({
      showNavbar: true,
      toggleNavbarOnMobileHandler: toggleOnMobile
    })
    render(<SidebarNavLink name="test" icon="i" />)
    await user.click(screen.getByRole('link'))
    expect(toggleOnMobile).toHaveBeenCalled()
  })

  it('renders with correct href and SubredditName', () => {
    mockUseHeaderState.mockReturnValue({
      showNavbar: true,
      toggleNavbarOnMobileHandler: vi.fn()
    })
    render(<SidebarNavLink name="test" icon="i" />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/r/test')
  })
})
