import {useSearch} from '@/lib/hooks'
import {act, render, screen, user} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {SearchBar} from './SearchBar'

vi.mock('@/lib/hooks', () => ({
  useSearch: vi.fn()
}))

const mockUseSearch = vi.mocked(useSearch)

describe('SearchBar', () => {
  const mockHandleOptionSelect = vi.fn()
  const mockHandleSubmit = vi.fn()
  const mockSetQuery = vi.fn()

  const defaultSearchState = {
    query: '',
    setQuery: mockSetQuery,
    groupedResults: {communities: [], nsfw: []},
    isLoading: false,
    hasError: false,
    errorMessage: '',
    handleOptionSelect: mockHandleOptionSelect,
    handleSubmit: mockHandleSubmit
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSearch.mockReturnValue(defaultSearchState)
  })

  describe('rendering', () => {
    it('renders search input', () => {
      render(<SearchBar />)

      const input = screen.getByRole('textbox', {
        name: 'Search Reddit or subreddits'
      })
      expect(input).toBeInTheDocument()
    })

    it('shows placeholder text', () => {
      render(<SearchBar />)

      expect(
        screen.getByPlaceholderText('Search Reddit... (Press / to focus)')
      ).toBeInTheDocument()
    })

    it('renders search icon', () => {
      const {container} = render(<SearchBar />)

      // eslint-disable-next-line testing-library/no-container
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('user input', () => {
    it('calls setQuery when user types', async () => {
      render(<SearchBar />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'test')

      expect(mockSetQuery).toHaveBeenCalled()
    })

    it('updates input value', async () => {
      mockUseSearch.mockReturnValue({
        ...defaultSearchState,
        query: 'reddit'
      })

      render(<SearchBar />)

      const input = screen.getByRole('textbox') as HTMLInputElement
      expect(input).toHaveValue('reddit')
    })
  })

  describe('keyboard shortcuts', () => {
    it('focuses input when / key is pressed', () => {
      render(<SearchBar />)

      const input = screen.getByRole('textbox')

      act(() => {
        const event = new KeyboardEvent('keydown', {key: '/', bubbles: true})
        document.dispatchEvent(event)
      })

      expect(input).toHaveFocus()
    })

    it('does not focus input when typing in another input', () => {
      render(
        <div>
          <input type="text" />
          <SearchBar />
        </div>
      )

      const otherInput = screen.getAllByRole('textbox')[0]
      const searchInput = screen.getByRole('textbox', {
        name: 'Search Reddit or subreddits'
      })

      otherInput.focus()

      act(() => {
        const event = new KeyboardEvent('keydown', {key: '/', bubbles: true})
        document.dispatchEvent(event)
      })

      expect(searchInput).not.toHaveFocus()
    })

    it('clears query when Escape is pressed with query present', async () => {
      mockUseSearch.mockReturnValue({
        ...defaultSearchState,
        query: 'test query'
      })

      render(<SearchBar />)

      const input = screen.getByRole('textbox')
      await user.type(input, '{Escape}')

      expect(mockSetQuery).toHaveBeenCalledWith('')
    })

    it('calls handleSubmit when Enter is pressed with query', async () => {
      mockUseSearch.mockReturnValue({
        ...defaultSearchState,
        query: 'test'
      })

      render(<SearchBar />)

      const input = screen.getByRole('textbox')
      await user.type(input, '{Enter}')

      expect(mockHandleSubmit).toHaveBeenCalled()
    })
  })

  describe('loading state', () => {
    it('shows loader when searching', () => {
      mockUseSearch.mockReturnValue({
        ...defaultSearchState,
        isLoading: true,
        query: 'test'
      })

      render(<SearchBar />)

      expect(screen.getByText('Searching...')).toBeInTheDocument()
    })

    it('does not show loader when not searching', () => {
      render(<SearchBar />)

      expect(screen.queryByText('Searching...')).not.toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('shows error message when hasError is true', () => {
      mockUseSearch.mockReturnValue({
        ...defaultSearchState,
        hasError: true,
        errorMessage: 'Failed to load results',
        query: 'test'
      })

      render(<SearchBar />)

      expect(screen.getByText('Failed to load results')).toBeInTheDocument()
    })

    it('shows default error message when errorMessage is empty', () => {
      mockUseSearch.mockReturnValue({
        ...defaultSearchState,
        hasError: true,
        errorMessage: '',
        query: 'test'
      })

      render(<SearchBar />)

      expect(screen.getByText('Error loading results')).toBeInTheDocument()
    })
  })

  describe('search results', () => {
    it('shows community results', () => {
      mockUseSearch.mockReturnValue({
        ...defaultSearchState,
        query: 'test',
        groupedResults: {
          communities: [
            {
              name: 't5_test',
              displayName: 'r/test',
              icon: 'https://example.com/icon.png',
              subscribers: 1000
            }
          ],
          nsfw: []
        }
      })

      render(<SearchBar />)

      expect(screen.getByText('COMMUNITIES')).toBeInTheDocument()
      expect(screen.getByText('r/test')).toBeInTheDocument()
      expect(screen.getByText('1,000 members')).toBeInTheDocument()
    })

    it('shows NSFW results separately', () => {
      mockUseSearch.mockReturnValue({
        ...defaultSearchState,
        query: 'test',
        groupedResults: {
          communities: [],
          nsfw: [
            {
              name: 't5_nsfw',
              displayName: 'r/nsfw_test',
              icon: 'https://example.com/icon.png',
              subscribers: 500
            }
          ]
        }
      })

      render(<SearchBar />)

      expect(screen.getAllByText('NSFW').length).toBeGreaterThan(0)
      expect(screen.getByText('r/nsfw_test')).toBeInTheDocument()
    })

    it('shows both community and NSFW sections', () => {
      mockUseSearch.mockReturnValue({
        ...defaultSearchState,
        query: 'test',
        groupedResults: {
          communities: [
            {
              name: 't5_test',
              displayName: 'r/test',
              icon: 'https://example.com/icon.png',
              subscribers: 1000
            }
          ],
          nsfw: [
            {
              name: 't5_nsfw',
              displayName: 'r/nsfw_test',
              icon: 'https://example.com/icon.png',
              subscribers: 500
            }
          ]
        }
      })

      render(<SearchBar />)

      expect(screen.getByText('COMMUNITIES')).toBeInTheDocument()
      expect(screen.getAllByText('NSFW').length).toBeGreaterThan(0)
    })

    it('shows no results message when query is long enough', () => {
      mockUseSearch.mockReturnValue({
        ...defaultSearchState,
        query: 'nonexistent',
        groupedResults: {communities: [], nsfw: []}
      })

      render(<SearchBar />)

      expect(
        screen.getByText('No subreddits found for "nonexistent"')
      ).toBeInTheDocument()
    })

    it('does not show results for short queries', () => {
      mockUseSearch.mockReturnValue({
        ...defaultSearchState,
        query: 'a',
        groupedResults: {communities: [], nsfw: []}
      })

      render(<SearchBar />)

      expect(
        screen.queryByText('No subreddits found for "a"')
      ).not.toBeInTheDocument()
    })
  })

  describe('result selection', () => {
    it('calls handleOptionSelect when result is clicked', async () => {
      mockUseSearch.mockReturnValue({
        ...defaultSearchState,
        query: 'test',
        groupedResults: {
          communities: [
            {
              name: 't5_test',
              displayName: 'r/test',
              icon: 'https://example.com/icon.png',
              subscribers: 1000
            }
          ],
          nsfw: []
        }
      })

      render(<SearchBar />)

      const result = screen.getByText('r/test')
      await user.click(result)

      expect(mockHandleOptionSelect).toHaveBeenCalledWith('r/test')
    })
  })

  describe('edge cases', () => {
    it('handles results without subscriber counts', () => {
      mockUseSearch.mockReturnValue({
        ...defaultSearchState,
        query: 'test',
        groupedResults: {
          communities: [
            {
              name: 't5_test',
              displayName: 'r/test',
              icon: '',
              subscribers: 0
            }
          ],
          nsfw: []
        }
      })

      render(<SearchBar />)

      expect(screen.getByText('r/test')).toBeInTheDocument()
      expect(screen.queryByText(/members/)).not.toBeInTheDocument()
    })

    it('handles results without icons', () => {
      mockUseSearch.mockReturnValue({
        ...defaultSearchState,
        query: 'test',
        groupedResults: {
          communities: [
            {
              name: 't5_test',
              displayName: 'r/test',
              icon: '',
              subscribers: 1000
            }
          ],
          nsfw: []
        }
      })

      render(<SearchBar />)

      expect(screen.getByText('r/test')).toBeInTheDocument()
    })

    it('handles empty query gracefully', () => {
      render(<SearchBar />)

      const input = screen.getByRole('textbox') as HTMLInputElement
      expect(input).toHaveValue('')
    })
  })
})
