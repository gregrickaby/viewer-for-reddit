import {render, screen, waitFor} from '@/test-utils'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'
import {SidebarPersonalizedSections} from './SidebarPersonalizedSections'

// Mock fetchUserSubscriptions to avoid env var errors
vi.mock('@/lib/actions/reddit', () => ({
  fetchUserSubscriptions: vi.fn()
}))

describe('SidebarPersonalizedSections', () => {
  const mockSubscriptions = [
    {
      name: 'programming',
      displayName: 'r/programming',
      icon: 'https://example.com/icon1.png'
    },
    {name: 'javascript', displayName: 'r/javascript'},
    {
      name: 'typescript',
      displayName: 'r/typescript',
      icon: 'https://example.com/icon2.png'
    }
  ]

  const mockMultireddits = [
    {
      name: 'tech',
      displayName: 'Tech News',
      path: '/user/testuser/m/tech',
      subreddits: ['programming', 'webdev'],
      icon: 'https://example.com/tech-icon.png'
    },
    {
      name: 'gaming',
      displayName: 'Gaming',
      path: '/user/testuser/m/gaming',
      subreddits: []
    }
  ]

  describe('subscriptions', () => {
    it('does not show subscriptions when list is empty', () => {
      render(<SidebarPersonalizedSections subscriptions={[]} />)

      expect(screen.queryByText('My Subreddits')).not.toBeInTheDocument()
    })

    it('renders subscriptions section', () => {
      render(<SidebarPersonalizedSections subscriptions={mockSubscriptions} />)

      expect(screen.getByText('My Subreddits')).toBeInTheDocument()
    })

    it('renders search input when subscriptions section is expanded', async () => {
      render(<SidebarPersonalizedSections subscriptions={mockSubscriptions} />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search subreddits...')
        expect(searchInput).toBeInTheDocument()
      })
    })

    it('renders sort select when subscriptions section is expanded', async () => {
      render(<SidebarPersonalizedSections subscriptions={mockSubscriptions} />)

      // In Mantine v9, aria-label is placed on the listbox rather than the textbox.
      // Use getByDisplayValue to find the Select by its visible value instead.
      await waitFor(() => {
        expect(screen.getByDisplayValue('Default Order')).toBeInTheDocument()
      })

      const sortInput = screen.getByDisplayValue('Default Order')
      expect(sortInput).toHaveValue('Default Order')
    })

    it('filters subscriptions by search query', async () => {
      const user = userEvent.setup()
      render(<SidebarPersonalizedSections subscriptions={mockSubscriptions} />)

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Search subreddits...')
        ).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search subreddits...')
      await user.type(searchInput, 'java')

      await waitFor(() => {
        expect(
          screen.getByRole('link', {name: /r\/javascript/i})
        ).toBeInTheDocument()
      })

      expect(
        screen.queryByRole('link', {name: /r\/programming/i})
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('link', {name: /r\/typescript/i})
      ).not.toBeInTheDocument()
    })

    it('renders all subscription links', async () => {
      render(<SidebarPersonalizedSections subscriptions={mockSubscriptions} />)

      await waitFor(() => {
        expect(
          screen.getByRole('link', {name: /r\/programming/i})
        ).toBeInTheDocument()
      })
      expect(
        screen.getByRole('link', {name: /r\/javascript/i})
      ).toBeInTheDocument()
      expect(
        screen.getByRole('link', {name: /r\/typescript/i})
      ).toBeInTheDocument()
    })

    it('maintains subscription order (no sorting)', async () => {
      render(<SidebarPersonalizedSections subscriptions={mockSubscriptions} />)

      await waitFor(() => {
        const links = screen.getAllByRole('link')
        const subscriptionLinks = links.filter((link) => {
          const href = link.getAttribute('href')
          return (
            href?.startsWith('/r/') &&
            href !== '/r/all' &&
            href !== '/r/popular'
          )
        })
        expect(subscriptionLinks.length).toBeGreaterThan(0)
      })

      const links = screen.getAllByRole('link')
      const subscriptionLinks = links.filter((link) => {
        const href = link.getAttribute('href')
        return (
          href?.startsWith('/r/') && href !== '/r/all' && href !== '/r/popular'
        )
      })

      expect(subscriptionLinks[0]).toHaveTextContent('r/programming')
      expect(subscriptionLinks[1]).toHaveTextContent('r/javascript')
      expect(subscriptionLinks[2]).toHaveTextContent('r/typescript')
    })

    it('has correct href for subscription links', async () => {
      render(<SidebarPersonalizedSections subscriptions={mockSubscriptions} />)

      const programmingLink = await screen.findByRole('link', {
        name: /r\/programming/i
      })
      expect(programmingLink).toHaveAttribute('href', '/r/programming')
    })

    it('renders subreddit icon when available', async () => {
      render(<SidebarPersonalizedSections subscriptions={mockSubscriptions} />)

      await waitFor(() => {
        expect(
          screen.getByRole('link', {name: /r\/programming/i})
        ).toBeInTheDocument()
      })

      const iconImg = screen.getByAltText('r/programming icon')
      expect(iconImg).toBeInTheDocument()
      expect(iconImg).toHaveAttribute('src', 'https://example.com/icon1.png')
    })

    it('renders fallback icon when subreddit has no icon', async () => {
      render(<SidebarPersonalizedSections subscriptions={mockSubscriptions} />)

      await waitFor(() => {
        expect(
          screen.getByRole('link', {name: /r\/javascript/i})
        ).toBeInTheDocument()
      })

      expect(screen.queryByAltText('r/javascript icon')).not.toBeInTheDocument()
    })

    it('renders multiple icons correctly', async () => {
      render(<SidebarPersonalizedSections subscriptions={mockSubscriptions} />)

      await waitFor(() => {
        const programmingIcon = screen.getByAltText('r/programming icon')
        expect(programmingIcon).toHaveAttribute(
          'src',
          'https://example.com/icon1.png'
        )
      })

      const typescriptIcon = screen.getByAltText('r/typescript icon')
      expect(typescriptIcon).toHaveAttribute(
        'src',
        'https://example.com/icon2.png'
      )

      expect(screen.queryByAltText('r/javascript icon')).not.toBeInTheDocument()
    })

    it('toggles subscriptions collapse when button clicked', async () => {
      const user = userEvent.setup()
      render(<SidebarPersonalizedSections subscriptions={mockSubscriptions} />)

      const collapseButton = screen.getByRole('button', {
        name: /collapse my subreddits/i
      })
      await user.click(collapseButton)

      expect(
        screen.getByRole('button', {name: /expand my subreddits/i})
      ).toBeInTheDocument()
    })

    it('shows subscriptions initially open', () => {
      render(<SidebarPersonalizedSections subscriptions={mockSubscriptions} />)

      expect(
        screen.getByRole('button', {name: /collapse my subreddits/i})
      ).toBeInTheDocument()
    })

    it('can toggle collapse by clicking anywhere on the header', async () => {
      const user = userEvent.setup()
      render(<SidebarPersonalizedSections subscriptions={mockSubscriptions} />)

      const header = screen.getByRole('button', {
        name: /collapse my subreddits/i
      })
      await user.click(header)

      expect(
        screen.getByRole('button', {name: /expand my subreddits/i})
      ).toBeInTheDocument()

      await user.click(header)

      expect(
        screen.getByRole('button', {name: /collapse my subreddits/i})
      ).toBeInTheDocument()
    })

    it('toggles subscriptions by keyboard', async () => {
      const user = userEvent.setup()
      render(<SidebarPersonalizedSections subscriptions={mockSubscriptions} />)

      let toggleButton = screen.getByRole('button', {
        name: /collapse my subreddits/i
      })

      toggleButton.focus()
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(
          screen.getByRole('button', {name: /expand my subreddits/i})
        ).toBeInTheDocument()
      })

      toggleButton = screen.getByRole('button', {
        name: /expand my subreddits/i
      })

      toggleButton.focus()
      await user.keyboard(' ')

      await waitFor(() => {
        expect(
          screen.getByRole('button', {name: /collapse my subreddits/i})
        ).toBeInTheDocument()
      })
    })
  })

  describe('multireddits', () => {
    it('does not show multireddits when list is empty', () => {
      render(<SidebarPersonalizedSections multireddits={[]} />)

      expect(screen.queryByText('Multireddits')).not.toBeInTheDocument()
    })

    it('renders multireddits section', async () => {
      render(<SidebarPersonalizedSections multireddits={mockMultireddits} />)

      expect(screen.getByText('My Multireddits')).toBeInTheDocument()

      await waitFor(() => {
        expect(
          screen.getByRole('link', {name: /tech news/i})
        ).toBeInTheDocument()
      })
    })

    it('renders all multireddit links', async () => {
      render(<SidebarPersonalizedSections multireddits={mockMultireddits} />)

      await waitFor(() => {
        expect(
          screen.getByRole('link', {name: /tech news/i})
        ).toBeInTheDocument()
      })
      expect(screen.getByRole('link', {name: /gaming/i})).toBeInTheDocument()
    })

    it('sorts multireddits alphabetically', async () => {
      render(<SidebarPersonalizedSections multireddits={mockMultireddits} />)

      await waitFor(() => {
        const links = screen.getAllByRole('link')
        const multiLinks = links.filter((link) =>
          link.getAttribute('href')?.includes('/m/')
        )
        expect(multiLinks.length).toBeGreaterThan(0)
      })

      const links = screen.getAllByRole('link')
      const multiLinks = links.filter((link) =>
        link.getAttribute('href')?.includes('/m/')
      )

      expect(multiLinks[0]).toHaveTextContent('Gaming')
      expect(multiLinks[1]).toHaveTextContent('Tech News')
    })

    it('has correct href for multireddit links', async () => {
      render(<SidebarPersonalizedSections multireddits={mockMultireddits} />)

      const techLink = await screen.findByRole('link', {name: /tech news/i})
      expect(techLink).toHaveAttribute('href', '/user/testuser/m/tech')
    })

    it('renders multireddit icon when available', async () => {
      render(<SidebarPersonalizedSections multireddits={mockMultireddits} />)

      await waitFor(() => {
        expect(
          screen.getByRole('link', {name: /tech news/i})
        ).toBeInTheDocument()
      })

      const iconImg = screen.getByAltText('Tech News icon')
      expect(iconImg).toBeInTheDocument()
      expect(iconImg).toHaveAttribute(
        'src',
        'https://example.com/tech-icon.png'
      )
    })

    it('renders fallback avatar with first letter when no icon', async () => {
      render(<SidebarPersonalizedSections multireddits={mockMultireddits} />)

      await waitFor(() => {
        expect(screen.getByRole('link', {name: /gaming/i})).toBeInTheDocument()
      })

      expect(screen.queryByAltText('Gaming icon')).not.toBeInTheDocument()
      expect(screen.getByText('G')).toBeInTheDocument()
    })

    it('toggles multireddits collapse when button clicked', async () => {
      const user = userEvent.setup()
      render(<SidebarPersonalizedSections multireddits={mockMultireddits} />)

      const collapseButton = screen.getByRole('button', {
        name: /collapse my multireddits/i
      })
      await user.click(collapseButton)

      expect(
        screen.getByRole('button', {name: /expand my multireddits/i})
      ).toBeInTheDocument()
    })

    it('shows multireddits initially open', () => {
      render(<SidebarPersonalizedSections multireddits={mockMultireddits} />)

      expect(
        screen.getByRole('button', {name: /collapse my multireddits/i})
      ).toBeInTheDocument()
    })

    it('can toggle collapse by clicking anywhere on the header', async () => {
      const user = userEvent.setup()
      render(<SidebarPersonalizedSections multireddits={mockMultireddits} />)

      const header = screen.getByRole('button', {
        name: /collapse my multireddits/i
      })
      await user.click(header)

      expect(
        screen.getByRole('button', {name: /expand my multireddits/i})
      ).toBeInTheDocument()

      await user.click(header)

      expect(
        screen.getByRole('button', {name: /collapse my multireddits/i})
      ).toBeInTheDocument()
    })

    it('toggles multireddits by keyboard', async () => {
      const user = userEvent.setup()
      render(<SidebarPersonalizedSections multireddits={mockMultireddits} />)

      let toggleButton = screen.getByRole('button', {
        name: /collapse my multireddits/i
      })

      toggleButton.focus()
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(
          screen.getByRole('button', {name: /expand my multireddits/i})
        ).toBeInTheDocument()
      })

      toggleButton = screen.getByRole('button', {
        name: /expand my multireddits/i
      })

      toggleButton.focus()
      await user.keyboard(' ')

      await waitFor(() => {
        expect(
          screen.getByRole('button', {name: /collapse my multireddits/i})
        ).toBeInTheDocument()
      })
    })
  })

  describe('with both subscriptions and multireddits', () => {
    it('renders both sections', async () => {
      render(
        <SidebarPersonalizedSections
          subscriptions={mockSubscriptions}
          multireddits={mockMultireddits}
        />
      )

      expect(screen.getByText('My Subreddits')).toBeInTheDocument()
      expect(screen.getByText('My Multireddits')).toBeInTheDocument()

      await waitFor(() => {
        expect(
          screen.getByRole('link', {name: /r\/programming/i})
        ).toBeInTheDocument()
      })
    })

    it('renders all links from both sections', async () => {
      render(
        <SidebarPersonalizedSections
          subscriptions={mockSubscriptions}
          multireddits={mockMultireddits}
        />
      )

      await waitFor(() => {
        expect(
          screen.getByRole('link', {name: /r\/programming/i})
        ).toBeInTheDocument()
      })

      expect(screen.getByRole('link', {name: /tech news/i})).toBeInTheDocument()
    })

    it('allows independent collapse state for each section', async () => {
      const user = userEvent.setup()
      render(
        <SidebarPersonalizedSections
          subscriptions={mockSubscriptions}
          multireddits={mockMultireddits}
        />
      )

      const subredditsToggle = screen.getByRole('button', {
        name: /collapse my subreddits/i
      })
      await user.click(subredditsToggle)

      expect(
        screen.getByRole('button', {name: /expand my subreddits/i})
      ).toBeInTheDocument()

      expect(
        screen.getByRole('button', {name: /collapse my multireddits/i})
      ).toBeInTheDocument()
    })
  })
})
