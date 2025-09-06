import {Search} from '@/components/Search/Search'
import {render, screen} from '@/test-utils'

vi.mock('@/lib/hooks/useSubredditSearch', () => ({
  useSubredditSearch: () => ({
    query: '',
    setQuery: vi.fn(),
    autoCompleteData: [
      {value: 'reactjs', display_name: 'reactjs', icon_img: ''}
    ]
  })
}))

vi.mock('@/lib/hooks/useHeaderState', () => ({
  useHeaderState: () => ({showNavbar: false, toggleNavbarHandler: vi.fn()})
}))

describe('Search', () => {
  it('renders search input', () => {
    render(<Search />)
    expect(
      screen.getByRole('textbox', {name: /Search subreddits/i})
    ).toBeInTheDocument()
  })
})
