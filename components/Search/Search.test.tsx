import {Search} from '@/components/Search/Search'
import {render, screen, user, waitFor} from '@/test-utils'

describe('Search', () => {
  it('renders search input', () => {
    render(<Search />)
    expect(
      screen.getByRole('textbox', {name: /Search subreddits/i})
    ).toBeInTheDocument()
  })

  it('shows grouped results when typing', async () => {
    render(<Search />)
    const input = screen.getByRole('textbox', {name: /Search subreddits/i})
    await user.type(input, 'aww')
    
    await waitFor(() => {
      expect(screen.getByText('Communities')).toBeInTheDocument()
    })
  })

  it('shows Search History section when query is empty and history exists', async () => {
    const mockHistory = [
      {
        display_name: 'aww',
        icon_img: '',
        over18: false,
        public_description: '',
        subscribers: 100,
        value: 'r/aww'
      }
    ]
    
    render(<Search />, {
      preloadedState: {
        settings: {
          searchHistory: mockHistory,
          currentSort: 'hot',
          currentSubreddit: '',
          enableNsfw: true,
          favorites: [],
          isMuted: true,
          recent: []
        }
      }
    })
    
    const input = screen.getByRole('textbox', {name: /Search subreddits/i})
    await user.click(input)
    
    await waitFor(() => {
      expect(screen.getByText('Search History')).toBeInTheDocument()
    })
  })

  it('shows clear button when input has value', async () => {
    render(<Search />)
    const input = screen.getByRole('textbox', {name: /Search subreddits/i})
    await user.type(input, 'test')
    
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument()
  })

  it('clears input when clear button is clicked', async () => {
    render(<Search />)
    const input = screen.getByRole('textbox', {name: /Search subreddits/i})
    await user.type(input, 'test')
    
    const clearButton = screen.getByLabelText('Clear search')
    await user.click(clearButton)
    
    expect(input).toHaveValue('')
  })

  it('shows empty state when no results found', async () => {
    render(<Search />)
    const input = screen.getByRole('textbox', {name: /Search subreddits/i})
    await user.type(input, 'notarealsubreddit')
    
    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument()
    })
  })

  it('opens dropdown on focus', async () => {
    render(<Search />)
    const input = screen.getByRole('textbox', {name: /Search subreddits/i})
    await user.click(input)
    
    // The dropdown should open and show Communities section
    await waitFor(() => {
      expect(screen.getByText('Communities')).toBeInTheDocument()
    })
  })

  it('closes dropdown when clicking outside', async () => {
    render(<Search />)
    const input = screen.getByRole('textbox', {name: /Search subreddits/i})
    await user.click(input)
    
    // Wait for dropdown to open
    await waitFor(() => {
      expect(screen.getByText('Communities')).toBeInTheDocument()
    })
    
    // Click outside (on document body)
    await user.click(document.body)
    
    // Dropdown should close
    await waitFor(() => {
      expect(screen.queryByText('Communities')).not.toBeInTheDocument()
    })
  })
})
