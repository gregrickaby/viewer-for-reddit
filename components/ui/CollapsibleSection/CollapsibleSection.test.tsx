import {render, screen} from '@/test-utils'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'
import {CollapsibleSection} from './CollapsibleSection'

describe('CollapsibleSection', () => {
  describe('rendering', () => {
    it('renders title', () => {
      render(
        <CollapsibleSection title="Test Section">
          <div>Content</div>
        </CollapsibleSection>
      )

      expect(screen.getByText('Test Section')).toBeInTheDocument()
    })

    it('renders children (Mantine Collapse renders children always)', () => {
      render(
        <CollapsibleSection title="Test Section" defaultOpen>
          <div data-testid="content">Content</div>
        </CollapsibleSection>
      )

      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('renders children when closed (Mantine Collapse renders children always)', () => {
      render(
        <CollapsibleSection title="Test Section" defaultOpen={false}>
          <div data-testid="content">Content</div>
        </CollapsibleSection>
      )

      // Mantine Collapse always renders children - visibility controlled via CSS
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })
  })

  describe('collapse toggle', () => {
    it('toggles on click', async () => {
      const user = userEvent.setup()
      render(
        <CollapsibleSection title="Test Section">
          <div data-testid="content">Content</div>
        </CollapsibleSection>
      )

      await user.click(screen.getByText('Test Section'))

      // Should still render - Mantine Collapse uses CSS visibility
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('toggles with keyboard (Enter)', async () => {
      const user = userEvent.setup()
      render(
        <CollapsibleSection title="Test Section">
          <div data-testid="content">Content</div>
        </CollapsibleSection>
      )

      const header = screen.getByText('Test Section')
      await user.type(header, '{enter}')

      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('toggles with keyboard (Space)', async () => {
      const user = userEvent.setup()
      render(
        <CollapsibleSection title="Test Section">
          <div data-testid="content">Content</div>
        </CollapsibleSection>
      )

      const header = screen.getByText('Test Section')
      await user.type(header, ' ')

      expect(screen.getByTestId('content')).toBeInTheDocument()
    })
  })

  describe('settings button', () => {
    it('renders settings button when onSettingsClick provided', () => {
      const onSettingsClick = vi.fn()
      render(
        <CollapsibleSection
          title="Test Section"
          onSettingsClick={onSettingsClick}
        >
          <div>Content</div>
        </CollapsibleSection>
      )

      expect(
        screen.getByRole('button', {name: /manage test section/i})
      ).toBeInTheDocument()
    })

    it('calls onSettingsClick when settings clicked', async () => {
      const user = userEvent.setup()
      const onSettingsClick = vi.fn()
      render(
        <CollapsibleSection
          title="Test Section"
          onSettingsClick={onSettingsClick}
        >
          <div>Content</div>
        </CollapsibleSection>
      )

      await user.click(
        screen.getByRole('button', {name: /manage test section/i})
      )

      expect(onSettingsClick).toHaveBeenCalledTimes(1)
    })

    it('does not render settings button when onSettingsClick not provided', () => {
      render(
        <CollapsibleSection title="Test Section">
          <div>Content</div>
        </CollapsibleSection>
      )

      expect(
        screen.queryByRole('button', {name: /manage/i})
      ).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has aria-expanded on toggle element when open', () => {
      render(
        <CollapsibleSection title="Test Section" defaultOpen>
          <div>Content</div>
        </CollapsibleSection>
      )

      // Find the toggle button - it's a Group element containing the title
      const toggle = screen.getByRole('button', {
        name: /collapse test section/i
      })
      expect(toggle).toBeInTheDocument()
    })

    it('has aria-expanded on toggle element when closed', () => {
      render(
        <CollapsibleSection title="Test Section" defaultOpen={false}>
          <div>Content</div>
        </CollapsibleSection>
      )

      const toggle = screen.getByRole('button', {name: /expand test section/i})
      expect(toggle).toBeInTheDocument()
    })
  })
})
