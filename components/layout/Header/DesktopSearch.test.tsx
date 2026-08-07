import {render, screen, user} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'

vi.mock('@mantine/spotlight', () => ({
  spotlight: {open: vi.fn()}
}))

import {spotlight} from '@mantine/spotlight'
import {DesktopSearch} from './DesktopSearch'

const mockSpotlightOpen = vi.mocked(spotlight.open)

describe('DesktopSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the search trigger button', () => {
    render(<DesktopSearch />)

    expect(
      screen.getByRole('button', {name: 'Open search'})
    ).toBeInTheDocument()
    expect(screen.getByText('Search Reddit...')).toBeInTheDocument()
  })

  it('opens the spotlight overlay when clicked', async () => {
    render(<DesktopSearch />)

    await user.click(screen.getByRole('button', {name: 'Open search'}))

    expect(mockSpotlightOpen).toHaveBeenCalledTimes(1)
  })
})
