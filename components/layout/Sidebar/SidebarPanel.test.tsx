import {SidebarProvider} from '@/components/layout/Sidebar/SidebarContext'
import {render, screen} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'

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
})
