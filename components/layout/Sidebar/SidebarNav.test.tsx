import {render, screen, waitFor} from '@/test-utils'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'
import {SidebarNav} from './SidebarNav'

describe('SidebarNav', () => {
  describe('static links', () => {
    it('renders Navigation section expanded by default', () => {
      render(<SidebarNav personalizedLinksSlot={null} />)

      expect(screen.getByText('Navigation')).toBeInTheDocument()
      expect(
        screen.getByRole('button', {name: /collapse navigation/i})
      ).toBeInTheDocument()
    })

    it('renders Home link', () => {
      render(<SidebarNav personalizedLinksSlot={null} />)

      const link = screen.getByRole('link', {name: /home/i})
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/')
    })

    it('renders About link', () => {
      render(<SidebarNav personalizedLinksSlot={null} />)

      const link = screen.getByRole('link', {name: /about/i})
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/about')
    })

    it('renders Donate link', () => {
      render(<SidebarNav personalizedLinksSlot={null} />)

      const link = screen.getByRole('link', {name: /donate/i})
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/donate')
    })

    it('renders GitHub link', () => {
      render(<SidebarNav personalizedLinksSlot={null} />)

      const link = screen.getByRole('link', {name: /github/i})
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute(
        'href',
        'https://github.com/gregrickaby/viewer-for-reddit'
      )
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  describe('personalizedLinksSlot', () => {
    it('renders the slot between Home and About', () => {
      render(
        <SidebarNav
          personalizedLinksSlot={
            <a href="/r/popular" data-testid="slot-link">
              Popular
            </a>
          }
        />
      )

      const slotLink = screen.getByTestId('slot-link')
      expect(slotLink).toBeInTheDocument()

      const links = screen.getAllByRole('link')
      const slotIndex = links.indexOf(slotLink)
      const homeIndex = links.findIndex((l) => /home/i.test(l.textContent!))
      const aboutIndex = links.findIndex((l) => /about/i.test(l.textContent!))

      expect(slotIndex).toBeGreaterThan(homeIndex)
      expect(slotIndex).toBeLessThan(aboutIndex)
    })

    it('renders nothing extra when the slot is null', () => {
      render(<SidebarNav personalizedLinksSlot={null} />)

      expect(screen.getAllByRole('link')).toHaveLength(4) // Home, About, Donate, GitHub
    })
  })

  describe('collapse behavior', () => {
    it('can toggle Navigation section collapse', async () => {
      const user = userEvent.setup()
      render(<SidebarNav personalizedLinksSlot={null} />)

      expect(
        screen.getByRole('button', {name: /collapse navigation/i})
      ).toBeInTheDocument()
      expect(screen.getByRole('link', {name: /home/i})).toBeInTheDocument()

      const collapseButton = screen.getByRole('button', {
        name: /collapse navigation/i
      })
      await user.click(collapseButton)

      await waitFor(() => {
        expect(
          screen.getByRole('button', {name: /expand navigation/i})
        ).toBeInTheDocument()
      })

      const expandButton = screen.getByRole('button', {
        name: /expand navigation/i
      })
      await user.click(expandButton)

      await waitFor(() => {
        expect(
          screen.getByRole('button', {name: /collapse navigation/i})
        ).toBeInTheDocument()
      })
      expect(screen.getByRole('link', {name: /home/i})).toBeInTheDocument()
    })

    it('toggles Navigation by keyboard', async () => {
      const user = userEvent.setup()
      render(<SidebarNav personalizedLinksSlot={null} />)

      let toggleButton = screen.getByRole('button', {
        name: /collapse navigation/i
      })

      toggleButton.focus()
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(
          screen.getByRole('button', {name: /expand navigation/i})
        ).toBeInTheDocument()
      })

      toggleButton = screen.getByRole('button', {name: /expand navigation/i})
      toggleButton.focus()
      await user.keyboard(' ')

      await waitFor(() => {
        expect(
          screen.getByRole('button', {name: /collapse navigation/i})
        ).toBeInTheDocument()
      })
    })
  })
})
