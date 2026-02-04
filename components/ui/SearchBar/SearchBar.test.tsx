import {useSearch} from '@/lib/hooks'
import {render, screen, user} from '@/test-utils'
import {useCombobox} from '@mantine/core'
import {useMediaQuery} from '@mantine/hooks'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {SearchBar} from './SearchBar'

// Mock Mantine hooks to control behavior
vi.mock('@mantine/core', async () => {
  const actual = await vi.importActual('@mantine/core')
  return {
    ...actual,
    useCombobox: vi.fn()
  }
})

vi.mock('@mantine/hooks', async () => {
  const actual = await vi.importActual('@mantine/hooks')
  return {
    ...actual,
    useMediaQuery: vi.fn()
  }
})

// Mock only useSearch, let useSearchBar use real implementation with mocked Mantine hooks
vi.mock('@/lib/hooks', async () => {
  const actual = await vi.importActual('@/lib/hooks')
  return {
    ...actual,
    useSearch: vi.fn()
  }
})

const mockUseSearch = vi.mocked(useSearch)
const mockUseCombobox = vi.mocked(useCombobox)
const mockUseMediaQuery = vi.mocked(useMediaQuery)

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

  const mockCombobox = {
    openDropdown: vi.fn(),
    closeDropdown: vi.fn(),
    resetSelectedOption: vi.fn(),
    updateSelectedOptionIndex: vi.fn(),
    selectFirstOption: vi.fn(),
    getState: vi.fn(() => ({
      listId: 'test-list-id',
      descriptionId: 'test-description-id'
    })),
    // Zustand-like store methods that Combobox.Options expects
    setListId: vi.fn((id: string) => {
      mockCombobox.getState = vi.fn(() => ({
        listId: id,
        descriptionId: mockCombobox.getState().descriptionId
      }))
    }),
    setDescriptionId: vi.fn((id: string) => {
      mockCombobox.getState = vi.fn(() => ({
        listId: mockCombobox.getState().listId,
        descriptionId: id
      }))
    }),
    subscribe: vi.fn(() => vi.fn()), // Zustand subscribe returns unsubscribe function
    destroy: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSearch.mockReturnValue(defaultSearchState)
    mockUseCombobox.mockReturnValue(mockCombobox as any)
    mockUseMediaQuery.mockReturnValue(false) // Default to desktop
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

      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('reddit')
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

      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('')
    })
  })

  describe('mobile behavior', () => {
    it('renders modal on mobile when mobileOpen is true', () => {
      mockUseMediaQuery.mockReturnValue(true) // Mobile

      render(<SearchBar mobileOpen onMobileClose={vi.fn()} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('does not render modal on desktop', () => {
      mockUseMediaQuery.mockReturnValue(false) // Desktop

      render(<SearchBar mobileOpen onMobileClose={vi.fn()} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('renders inline on desktop', () => {
      mockUseMediaQuery.mockReturnValue(false) // Desktop

      render(<SearchBar />)

      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
    })
  })
})
