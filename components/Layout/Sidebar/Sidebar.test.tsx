import {render, screen, waitFor} from '@/test-utils'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'
import {Sidebar} from './Sidebar'

describe('Sidebar', () => {
  const mockSubscriptions = [
    {name: 'programming', displayName: 'r/programming', icon: 'icon1.png'},
    {name: 'javascript', displayName: 'r/javascript'},
    {name: 'typescript', displayName: 'r/typescript'}
  ]

  const mockMultireddits = [
    {
      name: 'tech',
      displayName: 'Tech News',
      path: '/user/testuser/m/tech'
    },
    {
      name: 'gaming',
      displayName: 'Gaming',
      path: '/user/testuser/m/gaming'
    }
  ]

  describe('default feeds', () => {
    it('renders Popular link when not authenticated', () => {
      render(<Sidebar />)

      const link = screen.getByRole('link', {name: /popular/i})
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/')
      expect(link).toHaveAttribute('data-umami-event', 'nav-popular')
    })

    it('renders Home link when authenticated', () => {
      render(<Sidebar isAuthenticated />)

      const link = screen.getByRole('link', {name: /home/i})
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/')
      expect(link).toHaveAttribute('data-umami-event', 'nav-home')
    })

    it('renders All link', () => {
      render(<Sidebar />)

      const link = screen.getByRole('link', {name: /^all$/i})
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/r/all')
    })

    it('renders About link', () => {
      render(<Sidebar />)

      const link = screen.getByRole('link', {name: /about/i})
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/about')
    })

    it('renders Donate link', () => {
      render(<Sidebar />)

      const link = screen.getByRole('link', {name: /donate/i})
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/donate')
    })

    it('renders GitHub link', () => {
      render(<Sidebar />)

      const link = screen.getByRole('link', {name: /github/i})
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute(
        'href',
        'https://github.com/gregrickaby/viewer-for-reddit'
      )
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('renders Navigation heading', () => {
      render(<Sidebar />)

      expect(screen.getByText('Navigation')).toBeInTheDocument()
    })
  })

  describe('saved posts link', () => {
    it('does not show Saved Posts link when not authenticated', () => {
      render(<Sidebar isAuthenticated={false} />)

      expect(
        screen.queryByRole('link', {name: /saved posts/i})
      ).not.toBeInTheDocument()
    })

    it('does not show Saved Posts link when authenticated but no username', () => {
      render(<Sidebar isAuthenticated />)

      expect(
        screen.queryByRole('link', {name: /saved posts/i})
      ).not.toBeInTheDocument()
    })

    it('shows Saved Posts link when authenticated with username', () => {
      render(<Sidebar isAuthenticated username="testuser" />)

      const link = screen.getByRole('link', {name: /saved posts/i})
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/user/testuser/saved')
    })

    it('has analytics event on Saved Posts link', () => {
      render(<Sidebar isAuthenticated username="testuser" />)

      const link = screen.getByRole('link', {name: /saved posts/i})
      expect(link).toHaveAttribute('data-umami-event', 'nav-saved')
    })

    it('renders Saved Posts link in correct position (after All)', () => {
      render(<Sidebar isAuthenticated username="testuser" />)

      const allLinks = screen.getAllByRole('link')
      const navLinks = allLinks.slice(0, 6) // First 6 links are navigation

      expect(navLinks[0]).toHaveTextContent('Home')
      expect(navLinks[1]).toHaveTextContent('All')
      expect(navLinks[2]).toHaveTextContent('Saved Posts')
      expect(navLinks[3]).toHaveTextContent('About')
    })
  })

  describe('subscriptions - unauthenticated', () => {
    it('does not show subscriptions section when not authenticated', () => {
      render(
        <Sidebar isAuthenticated={false} subscriptions={mockSubscriptions} />
      )

      expect(screen.queryByText('My Subreddits')).not.toBeInTheDocument()
      expect(
        screen.queryByRole('link', {name: /r\/programming/i})
      ).not.toBeInTheDocument()
    })

    it('does not show subscriptions when authenticated but list is empty', () => {
      render(<Sidebar isAuthenticated subscriptions={[]} />)

      expect(screen.queryByText('My Subreddits')).not.toBeInTheDocument()
    })
  })

  describe('subscriptions - authenticated', () => {
    it('renders subscriptions section when authenticated', () => {
      render(<Sidebar isAuthenticated subscriptions={mockSubscriptions} />)

      expect(screen.getByText('My Subreddits')).toBeInTheDocument()
    })

    it('renders all subscription links', async () => {
      const user = userEvent.setup()
      render(<Sidebar isAuthenticated subscriptions={mockSubscriptions} />)

      // Expand to see links
      const expandButton = screen.getByRole('button', {
        name: /expand my subreddits/i
      })
      await user.click(expandButton)

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

    it('sorts subscriptions alphabetically', async () => {
      const user = userEvent.setup()
      render(<Sidebar isAuthenticated subscriptions={mockSubscriptions} />)

      // Expand to see links
      const expandButton = screen.getByRole('button', {
        name: /expand my subreddits/i
      })
      await user.click(expandButton)

      await waitFor(() => {
        const links = screen.getAllByRole('link')
        const subscriptionLinks = links.filter((link) => {
          const href = link.getAttribute('href')
          return href?.startsWith('/r/') && href !== '/r/all'
        })
        expect(subscriptionLinks.length).toBeGreaterThan(0)
      })

      const links = screen.getAllByRole('link')
      const subscriptionLinks = links.filter((link) => {
        const href = link.getAttribute('href')
        return href?.startsWith('/r/') && href !== '/r/all'
      })

      expect(subscriptionLinks[0]).toHaveTextContent('r/javascript')
      expect(subscriptionLinks[1]).toHaveTextContent('r/programming')
      expect(subscriptionLinks[2]).toHaveTextContent('r/typescript')
    })

    it('has correct href for subscription links', async () => {
      const user = userEvent.setup()
      render(<Sidebar isAuthenticated subscriptions={mockSubscriptions} />)

      // Expand to see links
      const expandButton = screen.getByRole('button', {
        name: /expand my subreddits/i
      })
      await user.click(expandButton)

      const programmingLink = await screen.findByRole('link', {
        name: /r\/programming/i
      })
      expect(programmingLink).toHaveAttribute('href', '/r/programming')
    })

    it('toggles subscriptions collapse when button clicked', async () => {
      const user = userEvent.setup()
      render(<Sidebar isAuthenticated subscriptions={mockSubscriptions} />)

      const expandButton = screen.getByRole('button', {
        name: /expand my subreddits/i
      })
      await user.click(expandButton)

      expect(
        screen.getByRole('button', {name: /collapse my subreddits/i})
      ).toBeInTheDocument()
    })

    it('shows subscriptions initially closed', () => {
      render(<Sidebar isAuthenticated subscriptions={mockSubscriptions} />)

      expect(
        screen.getByRole('button', {name: /expand my subreddits/i})
      ).toBeInTheDocument()
    })

    it('can toggle collapse by clicking anywhere on the header', async () => {
      const user = userEvent.setup()
      render(<Sidebar isAuthenticated subscriptions={mockSubscriptions} />)

      // Click the entire header (not just icon) to expand
      const header = screen.getByRole('button', {
        name: /expand my subreddits/i
      })
      await user.click(header)

      // Should be expanded now
      expect(
        screen.getByRole('button', {name: /collapse my subreddits/i})
      ).toBeInTheDocument()

      // Click again to collapse
      await user.click(header)

      // Should be collapsed now
      expect(
        screen.getByRole('button', {name: /expand my subreddits/i})
      ).toBeInTheDocument()
    })
  })

  describe('multireddits - unauthenticated', () => {
    it('does not show multireddits section when not authenticated', () => {
      render(
        <Sidebar isAuthenticated={false} multireddits={mockMultireddits} />
      )

      expect(screen.queryByText('Multireddits')).not.toBeInTheDocument()
      expect(
        screen.queryByRole('link', {name: /tech news/i})
      ).not.toBeInTheDocument()
    })

    it('does not show multireddits when authenticated but list is empty', () => {
      render(<Sidebar isAuthenticated multireddits={[]} />)

      expect(screen.queryByText('Multireddits')).not.toBeInTheDocument()
    })
  })

  describe('multireddits - authenticated', () => {
    it('renders multireddits section when authenticated', async () => {
      const user = userEvent.setup()
      render(<Sidebar isAuthenticated multireddits={mockMultireddits} />)

      expect(screen.getByText('My Multireddits')).toBeInTheDocument()

      // Expand to see links
      const expandButton = screen.getByRole('button', {
        name: /expand multireddits/i
      })
      await user.click(expandButton)

      // Wait for collapse animation and verify content is visible
      await waitFor(() => {
        expect(
          screen.getByRole('link', {name: /tech news/i})
        ).toBeInTheDocument()
      })
    })

    it('renders all multireddit links', async () => {
      const user = userEvent.setup()
      render(<Sidebar isAuthenticated multireddits={mockMultireddits} />)

      // Expand to see links
      const expandButton = screen.getByRole('button', {
        name: /expand multireddits/i
      })
      await user.click(expandButton)

      await waitFor(() => {
        expect(
          screen.getByRole('link', {name: /tech news/i})
        ).toBeInTheDocument()
      })
      expect(screen.getByRole('link', {name: /gaming/i})).toBeInTheDocument()
    })

    it('sorts multireddits alphabetically', async () => {
      const user = userEvent.setup()
      render(<Sidebar isAuthenticated multireddits={mockMultireddits} />)

      // Expand to see links
      const expandButton = screen.getByRole('button', {
        name: /expand multireddits/i
      })
      await user.click(expandButton)

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
      const user = userEvent.setup()
      render(<Sidebar isAuthenticated multireddits={mockMultireddits} />)

      // Expand to see links
      const expandButton = screen.getByRole('button', {
        name: /expand multireddits/i
      })
      await user.click(expandButton)

      const techLink = await screen.findByRole('link', {name: /tech news/i})
      expect(techLink).toHaveAttribute('href', '/user/testuser/m/tech')
    })

    it('toggles multireddits collapse when button clicked', async () => {
      const user = userEvent.setup()
      render(<Sidebar isAuthenticated multireddits={mockMultireddits} />)

      const expandButton = screen.getByRole('button', {
        name: /expand multireddits/i
      })
      await user.click(expandButton)

      expect(
        screen.getByRole('button', {name: /collapse multireddits/i})
      ).toBeInTheDocument()
    })

    it('shows multireddits initially closed', () => {
      render(<Sidebar isAuthenticated multireddits={mockMultireddits} />)

      expect(
        screen.getByRole('button', {name: /expand multireddits/i})
      ).toBeInTheDocument()
    })

    it('can toggle collapse by clicking anywhere on the header', async () => {
      const user = userEvent.setup()
      render(<Sidebar isAuthenticated multireddits={mockMultireddits} />)

      // Click the entire header (not just icon) to expand
      const header = screen.getByRole('button', {name: /expand multireddits/i})
      await user.click(header)

      // Should be expanded now
      expect(
        screen.getByRole('button', {name: /collapse multireddits/i})
      ).toBeInTheDocument()

      // Click again to collapse
      await user.click(header)

      // Should be collapsed now
      expect(
        screen.getByRole('button', {name: /expand multireddits/i})
      ).toBeInTheDocument()
    })
  })

  describe('authenticated with both subscriptions and multireddits', () => {
    it('renders both sections', async () => {
      const user = userEvent.setup()
      render(
        <Sidebar
          isAuthenticated
          subscriptions={mockSubscriptions}
          multireddits={mockMultireddits}
        />
      )

      expect(screen.getByText('My Subreddits')).toBeInTheDocument()
      expect(screen.getByText('My Multireddits')).toBeInTheDocument()

      // Expand both sections to verify they work
      const expandButtons = screen.getAllByRole('button', {name: /expand/i})
      for (const button of expandButtons) {
        await user.click(button)
      }

      // Wait for content to be visible
      await waitFor(() => {
        expect(
          screen.getByRole('link', {name: /r\/programming/i})
        ).toBeInTheDocument()
      })
    })

    it('renders all links from both sections', async () => {
      const user = userEvent.setup()
      render(
        <Sidebar
          isAuthenticated
          subscriptions={mockSubscriptions}
          multireddits={mockMultireddits}
        />
      )

      // Expand both sections
      const expandButtons = screen.getAllByRole('button', {name: /expand/i})
      for (const button of expandButtons) {
        await user.click(button)
      }

      // Wait for collapse animations to complete
      await waitFor(() => {
        // Subscriptions
        expect(
          screen.getByRole('link', {name: /r\/programming/i})
        ).toBeInTheDocument()
      })

      // Multireddits
      expect(screen.getByRole('link', {name: /tech news/i})).toBeInTheDocument()

      // Default feeds
      expect(screen.getByRole('link', {name: /home/i})).toBeInTheDocument()
    })

    it('allows independent collapse state for each section', async () => {
      const user = userEvent.setup()
      render(
        <Sidebar
          isAuthenticated
          subscriptions={mockSubscriptions}
          multireddits={mockMultireddits}
        />
      )

      // Both start collapsed - expand subreddits
      const subredditsToggle = screen.getByRole('button', {
        name: /expand my subreddits/i
      })
      await user.click(subredditsToggle)

      // Subreddits now open
      expect(
        screen.getByRole('button', {name: /collapse my subreddits/i})
      ).toBeInTheDocument()

      // Multireddits still closed
      expect(
        screen.getByRole('button', {name: /expand multireddits/i})
      ).toBeInTheDocument()
    })
  })

  describe('analytics tracking', () => {
    it('has analytics event on Popular link when not authenticated', () => {
      render(<Sidebar />)

      const link = screen.getByRole('link', {name: /popular/i})
      expect(link).toHaveAttribute('data-umami-event', 'nav-popular')
    })

    it('has analytics event on Home link when authenticated', () => {
      render(<Sidebar isAuthenticated />)

      const link = screen.getByRole('link', {name: /home/i})
      expect(link).toHaveAttribute('data-umami-event', 'nav-home')
    })

    it('has analytics event on subscription links', async () => {
      const user = userEvent.setup()
      render(<Sidebar isAuthenticated subscriptions={mockSubscriptions} />)

      // Expand to see links
      const expandButton = screen.getByRole('button', {
        name: /expand my subreddits/i
      })
      await user.click(expandButton)

      const link = await screen.findByRole('link', {name: /r\/programming/i})
      expect(link).toHaveAttribute('data-umami-event', 'nav-subreddit')
    })

    it('has analytics event on multireddit links', async () => {
      const user = userEvent.setup()
      render(<Sidebar isAuthenticated multireddits={mockMultireddits} />)

      // Expand to see links
      const expandButton = screen.getByRole('button', {
        name: /expand multireddits/i
      })
      await user.click(expandButton)

      const link = await screen.findByRole('link', {name: /tech news/i})
      expect(link).toHaveAttribute('data-umami-event', 'nav-multireddit')
    })
  })
})
