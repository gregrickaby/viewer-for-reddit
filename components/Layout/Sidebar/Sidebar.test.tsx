import {Sidebar} from '@/components/Layout/Sidebar/Sidebar'
import {render, screen} from '@/test-utils'

vi.mock('@mantine/hooks', async () => {
  const actual = await vi.importActual<any>('@mantine/hooks')
  return {
    ...actual,
    useMounted: () => true
  }
})

vi.mock('@/lib/hooks/util/useRemoveItemFromHistory', () => ({
  useRemoveItemFromHistory: () => ({remove: vi.fn()})
}))

vi.mock('@/lib/hooks/subreddit/useRemoveFromFavorites', () => ({
  useRemoveFromFavorites: () => ({remove: vi.fn()})
}))

vi.mock('@/lib/store/services/subredditApi', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    useGetPopularSubredditsQuery: () => ({data: []})
  }
})

vi.mock('@/lib/store/services/authenticatedApi', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    useGetUserSubscriptionsQuery: () => ({
      data: [
        {
          display_name: 'r/zebra',
          icon_img: '',
          over18: false,
          subscribers: 100,
          value: 'zebra'
        },
        {
          display_name: 'r/apple',
          icon_img: '',
          over18: false,
          subscribers: 200,
          value: 'apple'
        },
        {
          display_name: 'r/beta',
          icon_img: '',
          over18: false,
          subscribers: 300,
          value: 'beta'
        }
      ]
    }),
    useGetUserCustomFeedsQuery: () => ({
      data: [
        {
          display_name: 'Zebra Feed',
          name: 'zebra_feed',
          path: '/user/test/m/zebra_feed'
        },
        {
          display_name: 'Apple Feed',
          name: 'apple_feed',
          path: '/user/test/m/apple_feed'
        },
        {
          display_name: '',
          name: 'beta_feed',
          path: '/user/test/m/beta_feed'
        }
      ]
    })
  }
})

vi.mock('@/lib/hooks/ui/useHeaderState', () => ({
  useHeaderState: () => ({
    showNavbar: false,
    toggleNavbarHandler: vi.fn(),
    toggleNavbarOnMobileHandler: vi.fn()
  })
}))

describe('Sidebar', () => {
  it('should render links', () => {
    render(<Sidebar />)
    expect(screen.getByRole('link', {name: 'Home'})).toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'Popular'})).toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'All'})).toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'About'})).toBeInTheDocument()
  })

  it('should show Favorites section when not authenticated', () => {
    render(<Sidebar />, {
      preloadedState: {
        auth: {isAuthenticated: false, username: null, expiresAt: null},
        settings: {
          currentSort: 'hot',
          currentSubreddit: '',
          enableNsfw: true,
          isMuted: true,
          recent: [],
          searchHistory: [],
          favorites: [
            {
              display_name: 'r/test',
              icon_img: '',
              over18: false,
              subscribers: 1000,
              value: 'test'
            }
          ],
          commentSort: 'best'
        }
      }
    })
    expect(screen.getByText('Favorites')).toBeInTheDocument()
  })

  it('should hide Favorites section when authenticated', () => {
    render(<Sidebar />, {
      preloadedState: {
        auth: {
          isAuthenticated: true,
          username: 'testuser',
          expiresAt: Date.now() + 3600000
        }
      }
    })
    expect(screen.queryByText('Favorites')).not.toBeInTheDocument()
  })

  it('should sort My Communities alphabetically when authenticated', () => {
    render(<Sidebar />, {
      preloadedState: {
        auth: {
          isAuthenticated: true,
          username: 'testuser',
          expiresAt: Date.now() + 3600000
        }
      }
    })

    // Check that My Communities section appears
    expect(screen.getByText('My Communities')).toBeInTheDocument()

    // Check that communities are in alphabetical order
    const communities = screen.getAllByText(/^r\//)
    expect(communities[0]).toHaveTextContent('r/apple')
    expect(communities[1]).toHaveTextContent('r/beta')
    expect(communities[2]).toHaveTextContent('r/zebra')
  })

  it('should sort My Custom Feeds alphabetically when authenticated', () => {
    render(<Sidebar />, {
      preloadedState: {
        auth: {
          isAuthenticated: true,
          username: 'testuser',
          expiresAt: Date.now() + 3600000
        }
      }
    })

    // Check that My Custom Feeds section appears
    expect(screen.getByText('My Custom Feeds')).toBeInTheDocument()

    // Check that custom feeds are in alphabetical order
    expect(screen.getByText('Apple Feed')).toBeInTheDocument()
    expect(screen.getByText('beta_feed')).toBeInTheDocument()
    expect(screen.getByText('Zebra Feed')).toBeInTheDocument()

    // Verify the order by checking that Apple Feed appears before Zebra Feed
    const appleElement = screen.getByText('Apple Feed')
    const zebraElement = screen.getByText('Zebra Feed')
    expect(
      appleElement.compareDocumentPosition(zebraElement) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('should not show Saved Posts link when not authenticated', () => {
    render(<Sidebar />, {
      preloadedState: {
        auth: {isAuthenticated: false, username: null, expiresAt: null}
      }
    })
    expect(
      screen.queryByRole('link', {name: 'My Saved Posts'})
    ).not.toBeInTheDocument()
  })

  it('should show Saved Posts link when authenticated with username', () => {
    render(<Sidebar />, {
      preloadedState: {
        auth: {
          isAuthenticated: true,
          username: 'testuser',
          expiresAt: Date.now() + 3600000
        }
      }
    })
    const savedLink = screen.getByRole('link', {name: 'My Saved Posts'})
    expect(savedLink).toBeInTheDocument()
    expect(savedLink).toHaveAttribute('href', '/user/testuser/saved')
  })
})
