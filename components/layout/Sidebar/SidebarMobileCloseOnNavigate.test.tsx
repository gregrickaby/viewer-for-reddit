import {render, screen} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {SidebarMobileCloseOnNavigate} from './SidebarMobileCloseOnNavigate'

const mockUsePathname = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname()
}))

describe('SidebarMobileCloseOnNavigate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePathname.mockReturnValue('/')
  })

  it('does not call onNavigate on initial mount', () => {
    const onNavigate = vi.fn()
    render(<SidebarMobileCloseOnNavigate onNavigate={onNavigate} />)

    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('calls onNavigate when the pathname changes', () => {
    const onNavigate = vi.fn()
    const {rerender} = render(
      <SidebarMobileCloseOnNavigate onNavigate={onNavigate} />
    )

    mockUsePathname.mockReturnValue('/r/javascript')
    rerender(<SidebarMobileCloseOnNavigate onNavigate={onNavigate} />)

    expect(onNavigate).toHaveBeenCalledTimes(1)
  })

  it('does not call onNavigate again when the pathname is unchanged', () => {
    const onNavigate = vi.fn()
    const {rerender} = render(
      <SidebarMobileCloseOnNavigate onNavigate={onNavigate} />
    )

    rerender(<SidebarMobileCloseOnNavigate onNavigate={onNavigate} />)

    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('renders no visible output', () => {
    render(
      <div data-testid="wrapper">
        <SidebarMobileCloseOnNavigate onNavigate={vi.fn()} />
      </div>
    )

    expect(screen.getByTestId('wrapper')).toBeEmptyDOMElement()
  })
})
