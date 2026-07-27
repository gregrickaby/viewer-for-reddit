import {render, screen} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {Shell} from './Shell'

// Mock child components to isolate Shell tests.
vi.mock('../Header/Header', () => ({
  Header: () => <div data-testid="header" />
}))

vi.mock('../Sidebar/SidebarContext', () => ({
  SidebarProvider: ({children}: {children: React.ReactNode}) => (
    <div data-testid="sidebar-provider">{children}</div>
  )
}))

describe('Shell', () => {
  describe('rendering', () => {
    it('renders children content', () => {
      render(
        <Shell sidebarSlot={<div data-testid="sidebar-slot" />}>
          <div>Test Content</div>
        </Shell>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('renders Header component', () => {
      render(
        <Shell sidebarSlot={<div data-testid="sidebar-slot" />}>Content</Shell>
      )

      expect(screen.getByTestId('header')).toBeInTheDocument()
    })

    it('renders the provided sidebarSlot', () => {
      render(
        <Shell sidebarSlot={<aside data-testid="sidebar-slot">Sidebar</aside>}>
          Content
        </Shell>
      )

      expect(screen.getByTestId('sidebar-slot')).toBeInTheDocument()
      expect(screen.getByText('Sidebar')).toBeInTheDocument()
    })

    it('wraps content in SidebarProvider', () => {
      render(
        <Shell sidebarSlot={<div data-testid="sidebar-slot" />}>Content</Shell>
      )

      expect(screen.getByTestId('sidebar-provider')).toBeInTheDocument()
    })

    it('renders semantic HTML elements', () => {
      render(
        <Shell sidebarSlot={<div data-testid="sidebar-slot" />}>Content</Shell>
      )

      expect(screen.getByRole('banner')).toBeInTheDocument() // <header>
      expect(screen.getByRole('main')).toBeInTheDocument() // <main>
    })
  })
})
