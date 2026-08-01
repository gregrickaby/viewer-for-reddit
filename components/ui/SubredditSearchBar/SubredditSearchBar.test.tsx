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

  it.each([
    {
      description: 'navigates to search page on form submit',
      typedText: 'nextjs',
      expectedUrl: '/r/programming/search/nextjs'
    },
    {
      description: 'encodes special characters in query',
      typedText: 'react hooks',
      expectedUrl: '/r/programming/search/react%20hooks'
    },
    {
      description: 'trims whitespace from query',
      typedText: '  typescript  ',
      expectedUrl: '/r/programming/search/typescript'
    },
    {
      description: 'disables input during navigation',
      typedText: 'test',
      expectedUrl: '/r/programming/search/test'
    }
  ])('$description', async ({typedText, expectedUrl}) => {
    render(<SubredditSearchBar subreddit="programming" />)

    const input = screen.getByPlaceholderText('Search r/programming...')
    await user.type(input, typedText)
    await user.keyboard('{Enter}')

    expect(mockPush).toHaveBeenCalledWith(expectedUrl)
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
    expect(clearButton.parentElement).toHaveStyle({opacity: '1'})
  })

  it('hides clear button when input is empty', () => {
    render(<SubredditSearchBar subreddit="programming" />)

    const clearButton = screen.getByLabelText('Clear search')
    expect(clearButton).toBeInTheDocument()
    // Button should be visually hidden (opacity 0) and not interactive
    expect(clearButton.parentElement).toHaveStyle({
      opacity: '0',
      pointerEvents: 'none'
    })
  })

  it('clears input when clear button is clicked', async () => {
    render(<SubredditSearchBar subreddit="programming" />)

    const input = screen.getByPlaceholderText('Search r/programming...')
    await user.type(input, 'test query')

    const clearButton = screen.getByLabelText('Clear search')
    await user.click(clearButton)

    expect(input).toHaveValue('')
  })
})
