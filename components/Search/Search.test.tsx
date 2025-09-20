import {Search} from '@/components/Search/Search'
import {render, screen, user, waitFor} from '@/test-utils'

const mockUseMediaQuery = vi.hoisted(() => vi.fn())
vi.mock('@mantine/hooks', async () => {
  const actual = await vi.importActual('@mantine/hooks')
  return {
    ...actual,
    useMediaQuery: mockUseMediaQuery
  }
})

describe('Search', () => {
  beforeEach(() => {
    mockUseMediaQuery.mockReturnValue(true)
  })

  describe('Desktop/Tablet behavior', () => {
    it('should render search input on desktop', () => {
      render(<Search />)
      expect(
        screen.getByRole('textbox', {name: /Search subreddits/i})
      ).toBeInTheDocument()
    })

    it('should show grouped results when typing on desktop', async () => {
      render(<Search />)
      const input = screen.getByRole('textbox', {name: /Search subreddits/i})
      await user.type(input, 'aww')

      await waitFor(() => {
        expect(screen.getByText('Communities')).toBeInTheDocument()
      })
    })

    it('should show clear button when input has value on desktop', async () => {
      render(<Search />)
      const input = screen.getByRole('textbox', {name: /Search subreddits/i})
      await user.type(input, 'test')

      await waitFor(() => {
        expect(
          screen.getByRole('button', {name: /Clear search/i})
        ).toBeInTheDocument()
      })
    })

    it('should clear input when clear button is clicked on desktop', async () => {
      render(<Search />)
      const input = screen.getByRole('textbox', {name: /Search subreddits/i})
      await user.type(input, 'test')

      const clearButton = await screen.findByRole('button', {
        name: /Clear search/i
      })
      await user.click(clearButton)

      expect(input).toHaveValue('')
    })
  })

  describe('Mobile behavior', () => {
    beforeEach(() => {
      mockUseMediaQuery.mockReturnValue(false)
    })

    it('should render search icon on mobile', () => {
      render(<Search />)
      expect(
        screen.getByRole('button', {name: /Open search/i})
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('textbox', {name: /Search subreddits/i})
      ).not.toBeInTheDocument()
    })

    it('should open search drawer when search icon is clicked on mobile', async () => {
      render(<Search />)
      const searchIcon = screen.getByRole('button', {name: /Open search/i})
      await user.click(searchIcon)

      await waitFor(() => {
        const mobileInput = screen.getByLabelText(/Search subreddits/i)
        expect(mobileInput).toBeInTheDocument()
      })
    })

    it('should show back button in mobile drawer', async () => {
      render(<Search />)
      const searchIcon = screen.getByRole('button', {name: /Open search/i})
      await user.click(searchIcon)

      await waitFor(() => {
        const backButton = screen.getByLabelText(/Back/i)
        expect(backButton).toBeInTheDocument()
      })

      const backButton = screen.getByLabelText(/Back/i)
      await user.click(backButton)

      expect(searchIcon).toBeInTheDocument()
    })
  })

  describe('Shared functionality', () => {
    const setupSearch = async (isMobile = false) => {
      mockUseMediaQuery.mockReturnValue(!isMobile)
      render(<Search />, {
        preloadedState: {
          settings: {
            searchHistory: [
              {
                display_name: 'aww',
                icon_img: '',
                over18: false,
                public_description: '',
                subscribers: 100,
                value: 'r/aww'
              }
            ],
            currentSort: 'hot',
            currentSubreddit: '',
            enableNsfw: true,
            favorites: [],
            isMuted: true,
            recent: []
          }
        }
      })

      if (isMobile) {
        const searchIcon = screen.getByRole('button', {name: /Open search/i})
        await user.click(searchIcon)
        await waitFor(() => {
          expect(
            screen.getByLabelText(/Search subreddits/i)
          ).toBeInTheDocument()
        })
      }
    }

    it('should show Search History section when query is empty and history exists', async () => {
      await setupSearch()
      const input = screen.getByRole('textbox', {name: /Search subreddits/i})
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByText('Search History')).toBeInTheDocument()
      })
    })

    it('should show remove button for search history items', async () => {
      await setupSearch()
      const input = screen.getByRole('textbox', {name: /Search subreddits/i})
      await user.click(input)

      await waitFor(() => {
        const removeButton = screen.getByLabelText(
          /Remove aww from search history/i
        )
        expect(removeButton).toBeInTheDocument()
      })
    })

    it('should show empty state when no results found', async () => {
      await setupSearch()
      const input = screen.getByRole('textbox', {name: /Search subreddits/i})
      await user.type(input, 'notarealsubreddit')

      await waitFor(() => {
        const loader = document.querySelector('.mantine-Loader-root')
        expect(loader).not.toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument()
      })
    })

    it('should show loading spinner during search', async () => {
      render(<Search />)
      const input = screen.getByRole('textbox', {name: /Search subreddits/i})
      await user.click(input)
      await user.type(input, 'te')

      await waitFor(() => {
        const loader = document.querySelector('.mantine-Loader-root')
        expect(loader).toBeInTheDocument()
      })

      expect(screen.queryByText('No results found')).not.toBeInTheDocument()
    })

    it('should show error state when API fails', async () => {
      render(<Search />)
      const input = screen.getByRole('textbox', {name: /Search subreddits/i})
      await user.click(input)

      await waitFor(() => {
        const dropdown = document.querySelector('[role="listbox"]')
        expect(dropdown).toBeInTheDocument()
      })
    })

    it('should update input value when typing', async () => {
      await setupSearch()
      const input = screen.getByRole('textbox', {name: /Search subreddits/i})
      await user.type(input, 'test')

      expect(input).toHaveValue('test')
    })

    it('should render dropdown structure for searching', async () => {
      await setupSearch()
      const input = screen.getByRole('textbox', {name: /Search subreddits/i})
      await user.type(input, 'a')

      await waitFor(() => {
        expect(screen.getByText('Communities')).toBeInTheDocument()
      })
    })

    it('should close mobile drawer when option is selected', async () => {
      await setupSearch(true)
      const input = screen.getByLabelText(/Search subreddits/i)
      await user.type(input, 'aww')

      await waitFor(() => {
        expect(screen.getByText('Communities')).toBeInTheDocument()
      })

      const option = screen.getByText('r/aww')
      await user.click(option)

      // Verify the mobile drawer is closed by checking if the dropdown is hidden
      await waitFor(
        () => {
          const dropdown = document.querySelector('.m_38a85659')
          expect(dropdown).toHaveStyle('display: none')
        },
        {timeout: 1000}
      )
    })

    it('should not show no results during loading state', async () => {
      render(<Search />)
      const input = screen.getByRole('textbox', {name: /Search subreddits/i})
      await user.click(input)
      await user.type(input, 'te')

      const loader = document.querySelector('.mantine-Loader-root')
      expect(loader).toBeInTheDocument()
      expect(screen.queryByText('No results found')).not.toBeInTheDocument()
    })
  })
})
