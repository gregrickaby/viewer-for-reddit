import {useSearch} from '@/lib/hooks/useSearch'
import {render, screen, user} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {SearchBar} from './SearchBar'

vi.mock('@/lib/hooks/useSearch', () => ({
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
    it('renders search input when spotlight is open', () => {
      render(<SearchBar forceOpened />)

      expect(
        screen.getByRole('textbox', {name: 'Search Reddit or subreddits'})
      ).toBeInTheDocument()
    })

    it('shows correct placeholder', () => {
      render(<SearchBar forceOpened />)

      expect(
        screen.getByPlaceholderText('Search Reddit...')
      ).toBeInTheDocument()
    })
  })

  describe('user input', () => {
    it('calls setQuery when user types', async () => {
      render(<SearchBar forceOpened />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'test')

      expect(mockSetQuery).toHaveBeenCalled()
    })

    it('shows current query value in input', () => {
      mockUseSearch.mockReturnValue({...defaultSearchState, query: 'reddit'})

      render(<SearchBar forceOpened />)

      expect(screen.getByRole('textbox')).toHaveValue('reddit')
    })
  })

  describe('loading state', () => {
    it('shows searching message while loading', () => {
      mockUseSearch.mockReturnValue({
        ...defaultSearchState,
        isLoading: true,
        query: 'test'
      })

      render(<SearchBar forceOpened />)

      expect(screen.getByText('Searching...')).toBeInTheDocument()
    })

    it('does not show searching message when not loading', () => {
      render(<SearchBar forceOpened />)

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

      render(<SearchBar forceOpened />)

      expect(screen.getByText('Failed to load results')).toBeInTheDocument()
    })

    it('shows default error message when errorMessage is empty', () => {
      mockUseSearch.mockReturnValue({
        ...defaultSearchState,
        hasError: true,
        errorMessage: '',
        query: 'test'
      })

      render(<SearchBar forceOpened />)

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

      render(<SearchBar forceOpened />)

      expect(screen.getByText('r/test')).toBeInTheDocument()
      expect(screen.getByText('1.0K members')).toBeInTheDocument()
    })

    it('shows NSFW results with badge', () => {
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

      render(<SearchBar forceOpened />)

      expect(screen.getByText('r/nsfw_test')).toBeInTheDocument()
      expect(screen.getByText('NSFW')).toBeInTheDocument()
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
              icon: '',
              subscribers: 1000
            }
          ],
          nsfw: [
            {
              name: 't5_nsfw',
              displayName: 'r/nsfw_test',
              icon: '',
              subscribers: 500
            }
          ]
        }
      })

      render(<SearchBar forceOpened />)

      expect(screen.getByText('r/test')).toBeInTheDocument()
      expect(screen.getByText('r/nsfw_test')).toBeInTheDocument()
    })

    it('shows no-results message for unmatched query', () => {
      mockUseSearch.mockReturnValue({
        ...defaultSearchState,
        query: 'nonexistent',
        groupedResults: {communities: [], nsfw: []}
      })

      render(<SearchBar forceOpened />)

      expect(
        screen.getByText('No subreddits found for "nonexistent"')
      ).toBeInTheDocument()
    })

    it('does not show no-results message for short queries', () => {
      mockUseSearch.mockReturnValue({
        ...defaultSearchState,
        query: 'a',
        groupedResults: {communities: [], nsfw: []}
      })

      render(<SearchBar forceOpened />)

      expect(
        screen.queryByText('No subreddits found for "a"')
      ).not.toBeInTheDocument()
    })
  })

  describe('result selection', () => {
    it('calls handleOptionSelect when a result is clicked', async () => {
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

      render(<SearchBar forceOpened />)

      await user.click(screen.getByText('r/test'))

      expect(mockHandleOptionSelect).toHaveBeenCalledWith('r/test')
    })
  })

  describe('edge cases', () => {
    it('does not show member count when subscribers is zero', () => {
      mockUseSearch.mockReturnValue({
        ...defaultSearchState,
        query: 'test',
        groupedResults: {
          communities: [
            {name: 't5_test', displayName: 'r/test', icon: '', subscribers: 0}
          ],
          nsfw: []
        }
      })

      render(<SearchBar forceOpened />)

      expect(screen.getByText('r/test')).toBeInTheDocument()
      expect(screen.queryByText(/members/)).not.toBeInTheDocument()
    })

    it('handles empty query gracefully', () => {
      render(<SearchBar forceOpened />)

      expect(screen.getByRole('textbox')).toHaveValue('')
    })
  })
})
