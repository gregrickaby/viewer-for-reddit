import {SubredditName} from '@/components/SubredditName/SubredditName'
import {render, screen} from '@/test-utils'
import userEvent from '@testing-library/user-event'

vi.mock('@/components/Favorite/Favorite', () => ({
  Favorite: () => <div data-testid="favorite" />
}))

describe('SubredditName', () => {
  it('renders name and handles delete', async () => {
    const onDelete = vi.fn()
    render(<SubredditName name="test" onDelete={onDelete} enableFavorite />)
    expect(screen.getByText('r/test')).toBeInTheDocument()
    expect(screen.getByTestId('favorite')).toBeInTheDocument()
    const btn = screen.getByRole('button', {name: 'Remove'})
    await userEvent.click(btn)
    expect(onDelete).toHaveBeenCalled()
  })
})
