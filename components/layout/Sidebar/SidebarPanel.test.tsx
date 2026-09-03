import {
  SidebarProvider,
  useSidebar
} from '@/components/layout/Sidebar/SidebarContext'
import {fireEvent, render, screen, user} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'

/** Exposes a button that opens the mobile sidebar, for tests that need it open before interacting with the overlay. */
function MobileOpenTrigger() {
  const {toggleMobile} = useSidebar()
  return (
    <button type="button" onClick={toggleMobile}>
      Open mobile sidebar
    </button>
  )
}

vi.mock('next/navigation', () => ({
  usePathname: () => '/'
}))

const mockUseMediaQuery = vi.fn()
vi.mock('@mantine/hooks', async () => {
  const actual =
    await vi.importActual<typeof import('@mantine/hooks')>('@mantine/hooks')
  return {
    ...actual,
    useMediaQuery: () => mockUseMediaQuery()
  }
})

vi.mock('./SidebarNav', () => ({
  SidebarNav: ({personalizedLinksSlot}: {personalizedLinksSlot: unknown}) => (
    <nav data-testid="sidebar-nav">{personalizedLinksSlot as never}</nav>
  )
}))

import {SidebarPanel} from './SidebarPanel'

describe('SidebarPanel', () => {
  it('renders the sidebar landmark with both slots', () => {
    mockUseMediaQuery.mockReturnValue(false)

    render(
      <SidebarProvider>
        <SidebarPanel
          personalizedLinksSlot={<span data-testid="links-slot" />}
          personalizedSectionsSlot={<div data-testid="sections-slot" />}
        />
      </SidebarProvider>
    )

    expect(
      screen.getByRole('complementary', {name: /sidebar navigation/i})
    ).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-nav')).toBeInTheDocument()
    expect(screen.getByTestId('links-slot')).toBeInTheDocument()
    expect(screen.getByTestId('sections-slot')).toBeInTheDocument()
  })

  it('renders a mobile backdrop overlay button', () => {
    mockUseMediaQuery.mockReturnValue(true)

    render(
      <SidebarProvider>
        <SidebarPanel
          personalizedLinksSlot={null}
          personalizedSectionsSlot={null}
        />
      </SidebarProvider>
    )

    expect(
      screen.getByRole('button', {name: /close sidebar/i})
    ).toBeInTheDocument()
  })

  it('closes the mobile sidebar when Escape is pressed on the overlay', async () => {
    mockUseMediaQuery.mockReturnValue(true)

    render(
      <SidebarProvider>
        <MobileOpenTrigger />
        <SidebarPanel
          personalizedLinksSlot={null}
          personalizedSectionsSlot={null}
        />
      </SidebarProvider>
    )

    await user.click(screen.getByRole('button', {name: /open mobile sidebar/i}))
    const overlay = screen.getByRole('button', {name: /close sidebar/i})
    expect(overlay).toHaveAttribute('data-visible', 'true')

    fireEvent.keyDown(overlay, {key: 'Escape'})

    expect(overlay).toHaveAttribute('data-visible', 'false')
  })

  it('ignores non-Escape keys on the overlay', async () => {
    mockUseMediaQuery.mockReturnValue(true)

    render(
      <SidebarProvider>
        <MobileOpenTrigger />
        <SidebarPanel
          personalizedLinksSlot={null}
          personalizedSectionsSlot={null}
        />
      </SidebarProvider>
    )

    await user.click(screen.getByRole('button', {name: /open mobile sidebar/i}))
    const overlay = screen.getByRole('button', {name: /close sidebar/i})

    fireEvent.keyDown(overlay, {key: 'Enter'})

    expect(overlay).toHaveAttribute('data-visible', 'true')
  })
})
