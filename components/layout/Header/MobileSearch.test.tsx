import {render, screen, user} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'

vi.mock('@mantine/spotlight', () => ({
  spotlight: {open: vi.fn()}
}))

vi.mock('@/components/ui/SearchBar/SearchBar', () => ({
  SearchBar: () => <div data-testid="searchbar-overlay" />
}))

import {spotlight} from '@mantine/spotlight'
import {MobileSearch} from './MobileSearch'

const mockSpotlightOpen = vi.mocked(spotlight.open)

describe('MobileSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the search icon button', () => {
    render(<MobileSearch />)

    expect(screen.getByRole('button', {name: 'Search'})).toBeInTheDocument()
  })

  it('opens the spotlight overlay when clicked', async () => {
    render(<MobileSearch />)

    await user.click(screen.getByRole('button', {name: 'Search'}))

    expect(mockSpotlightOpen).toHaveBeenCalledTimes(1)
  })
})
