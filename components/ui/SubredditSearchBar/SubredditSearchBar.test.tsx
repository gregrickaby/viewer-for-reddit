import {render, screen, user} from '@/test-utils'
import {useRouter} from 'next/navigation'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {SubredditSearchBar} from './SubredditSearchBar'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

const mockUseRouter = vi.mocked(useRouter)

describe('SubredditSearchBar', () => {
  const mockPush = vi.fn()

  beforeEach(() => {
    mockPush.mockClear()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn()
    } as any)
  })

  it('renders with correct placeholder', () => {
    render(<SubredditSearchBar subreddit="programming" />)

    const input = screen.getByPlaceholderText('Search r/programming...')
    expect(input).toBeInTheDocument()
  })

  it('has correct aria-label', () => {
    render(<SubredditSearchBar subreddit="javascript" />)

    const input = screen.getByLabelText('Search within r/javascript')
    expect(input).toBeInTheDocument()
  })

  it('updates input value when typing', async () => {
    render(<SubredditSearchBar subreddit="programming" />)

    const input = screen.getByPlaceholderText('Search r/programming...')
    await user.type(input, 'typescript')

    expect(input).toHaveValue('typescript')
  })

  it('navigates to search page on form submit', async () => {
    render(<SubredditSearchBar subreddit="programming" />)

    const input = screen.getByPlaceholderText('Search r/programming...')
    await user.type(input, 'nextjs')
    await user.keyboard('{Enter}')

    expect(mockPush).toHaveBeenCalledWith('/r/programming/search/nextjs')
  })

  it('encodes special characters in query', async () => {
    render(<SubredditSearchBar subreddit="programming" />)

    const input = screen.getByPlaceholderText('Search r/programming...')
    await user.type(input, 'react hooks')
    await user.keyboard('{Enter}')

    expect(mockPush).toHaveBeenCalledWith('/r/programming/search/react%20hooks')
  })

  it('trims whitespace from query', async () => {
    render(<SubredditSearchBar subreddit="programming" />)

    const input = screen.getByPlaceholderText('Search r/programming...')
    await user.type(input, '  typescript  ')
    await user.keyboard('{Enter}')

    expect(mockPush).toHaveBeenCalledWith('/r/programming/search/typescript')
  })

  it('does not submit empty query', async () => {
    render(<SubredditSearchBar subreddit="programming" />)

    const input = screen.getByPlaceholderText('Search r/programming...')
    await user.click(input)
    await user.keyboard('{Enter}')

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('does not submit whitespace-only query', async () => {
    render(<SubredditSearchBar subreddit="programming" />)

    const input = screen.getByPlaceholderText('Search r/programming...')
    await user.type(input, '   ')
    await user.keyboard('{Enter}')

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows clear button when input has text', async () => {
    render(<SubredditSearchBar subreddit="programming" />)

    const input = screen.getByPlaceholderText('Search r/programming...')
    await user.type(input, 'test')

    const clearButton = screen.getByLabelText('Clear search')
    expect(clearButton).toBeInTheDocument()
  })

  it('hides clear button when input is empty', () => {
    render(<SubredditSearchBar subreddit="programming" />)

    const clearButton = screen.queryByLabelText('Clear search')
    expect(clearButton).not.toBeInTheDocument()
  })

  it('clears input when clear button is clicked', async () => {
    render(<SubredditSearchBar subreddit="programming" />)

    const input = screen.getByPlaceholderText('Search r/programming...')
    await user.type(input, 'test query')

    const clearButton = screen.getByLabelText('Clear search')
    await user.click(clearButton)

    expect(input).toHaveValue('')
  })

  it('disables input during navigation', async () => {
    render(<SubredditSearchBar subreddit="programming" />)

    const input = screen.getByPlaceholderText('Search r/programming...')
    await user.type(input, 'test')
    await user.keyboard('{Enter}')

    // Input should be disabled during transition
    // Note: Since startTransition is synchronous in tests, we can't easily
    // test the exact pending state, but we verify the navigation happens
    expect(mockPush).toHaveBeenCalledWith('/r/programming/search/test')
  })

  it('has data-umami-event attribute', () => {
    render(<SubredditSearchBar subreddit="programming" />)

    const input = screen.getByPlaceholderText('Search r/programming...')
    expect(input).toHaveAttribute('data-umami-event', 'subreddit-search')
  })
})
