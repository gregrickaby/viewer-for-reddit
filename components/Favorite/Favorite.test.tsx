import {Favorite} from '@/components/Favorite/Favorite'
import {render, screen} from '@/test-utils'
import userEvent from '@testing-library/user-event'

const toggleMock = vi.fn()
vi.mock('@/lib/hooks/useToggleFavorite', () => ({
  useToggleFavorite: () => ({
    isFavorite: false,
    loading: false,
    toggle: toggleMock
  })
}))

describe('Favorite', () => {
  beforeEach(() => {
    toggleMock.mockClear()
  })

  it('does not render for disallowed subreddits', () => {
    render(<Favorite subreddit="all" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders button and toggles favorite on click', async () => {
    render(<Favorite subreddit="nextjs" />)
    const btn = screen.getByRole('button', {name: 'Add to favorites'})
    await userEvent.click(btn)
    expect(toggleMock).toHaveBeenCalled()
  })
})
