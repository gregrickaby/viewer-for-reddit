import {SidebarSection} from '@/components/Sidebar/SidebarSection'
import {render, screen} from '@/test-utils'
import userEvent from '@testing-library/user-event'

const {handleDelete, navLinkMock} = vi.hoisted(() => ({
  handleDelete: vi.fn(),
  navLinkMock: vi.fn((props: any) => (
    <div
      data-testid="nav-link"
      role="button"
      tabIndex={0}
      onClick={() => props.onDelete?.()}
      onKeyDown={() => props.onDelete?.()}
    >
      {props.name}
    </div>
  ))
}))

vi.mock('@/lib/hooks/useSidebarSection', () => ({
  useSidebarSection: () => ({
    handleDelete,
    isFavorite: vi.fn(),
    handleToggleFavorite: vi.fn()
  })
}))

vi.mock('@/components/Sidebar/SidebarNavLink', () => ({
  SidebarNavLink: navLinkMock
}))

vi.mock('@mantine/core', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    NavLink: ({label, children}: any) => (
      <div>
        <div>{label}</div>
        {children}
      </div>
    )
  }
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SidebarSection', () => {
  it('returns null when no subreddits', () => {
    render(<SidebarSection label="Test" subreddits={[]} />)
    expect(screen.queryByText('Test')).not.toBeInTheDocument()
  })

  it('renders subreddits and handles delete when enabled', async () => {
    const user = userEvent.setup()
    navLinkMock.mockClear()
    const subs: any = [{display_name: 'a', icon_img: ''}]
    render(
      <SidebarSection label="L" subreddits={subs} enableDelete enableFavorite />
    )
    expect(screen.getByText('L')).toBeInTheDocument()
    const props = navLinkMock.mock.calls[0][0]
    expect(props.enableFavorite).toBe(true)
    expect(typeof props.onDelete).toBe('function')
    await user.click(screen.getByTestId('nav-link'))
    expect(handleDelete).toHaveBeenCalled()
  })

  it('renders without delete when disabled', () => {
    navLinkMock.mockClear()
    const subs: any = [{display_name: 'b', icon_img: ''}]
    render(<SidebarSection label="L" subreddits={subs} enableFavorite />)
    const props = navLinkMock.mock.calls[0][0]
    expect(props.onDelete).toBeUndefined()
  })
})
