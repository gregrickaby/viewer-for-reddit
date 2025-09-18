import {Search} from '@/components/Search/Search'
import {render, screen, user, waitFor, within} from '@/test-utils'
import {vi} from 'vitest'

describe('Search', () => {
  it('renders search input', () => {
    render(<Search />)
    expect(
      screen.getByRole('textbox', {name: /Search subreddits/i})
    ).toBeInTheDocument()
  })

  it('shows popular subreddits by default (empty input)', async () => {
    render(<Search />)
    const input = screen.getByRole('textbox', {name: /Search subreddits/i})
    await user.click(input)
    await waitFor(() => {
      expect(screen.getByText(/r\/Home/i)).toBeInTheDocument()
    })
    expect(screen.getAllByText(/^r\//i).length).toBeGreaterThan(0)
  })

  it('shows autocomplete results when typing', async () => {
    render(<Search />)
    const input = screen.getByRole('textbox', {name: /Search subreddits/i})
    await user.type(input, 'aww')
    await waitFor(() => {
      expect(screen.getAllByText('r/aww')[0]).toBeInTheDocument()
    })
  })

  it('renders subreddit link and favorite icon in option', async () => {
    render(<Search />)
    const input = screen.getByRole('textbox', {name: /Search subreddits/i})
    await user.type(input, 'aww')
    await waitFor(() => {
      expect(screen.getAllByText('r/aww')[0]).toBeInTheDocument()
    })
    const nameNode = screen.getAllByText('r/aww')[0]
    const link = nameNode.closest('a')
    expect(link).toBeTruthy()
    expect(link?.getAttribute('href')?.endsWith('/r/aww')).toBe(true)
    expect(
      within(link as HTMLElement).getByRole('button', {
        name: /add to favorites|remove from favorites/i,
        hidden: true
      })
    ).toBeInTheDocument()
  })

  it('clears input and shows popular subreddits again', async () => {
    render(<Search />)
    const input = screen.getByRole('textbox', {name: /Search subreddits/i})
    await user.type(input, 'aww')
    await waitFor(() => {
      expect(screen.getAllByText('r/aww')[0]).toBeInTheDocument()
    })
    await user.clear(input)
    await waitFor(() => {
      expect(screen.getByText('r/Home')).toBeInTheDocument()
    })
  })

  it('shows empty state when no results', async () => {
    render(<Search />)
    const input = screen.getByRole('textbox', {name: /Search subreddits/i})
    await user.type(input, 'notarealsubreddit')
    await waitFor(() => {
      expect(screen.queryAllByRole('option').length).toBe(0)
    })
  })

  it('supports keyboard navigation and selection', async () => {
    render(<Search />)
    const input = screen.getByRole('textbox', {name: /Search subreddits/i})
    await user.type(input, 'aww')
    await waitFor(() => {
      expect(screen.getAllByText('r/aww')[0]).toBeInTheDocument()
    })
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Enter}')
    expect(input).toHaveValue('r/aww')
  })

  it('calls toggleNavbarHandler if showNavbar is true when clicking option', async () => {
    vi.resetModules()
    const toggleMock = vi.fn()
    vi.doMock('@/lib/hooks/useHeaderState', () => ({
      useHeaderState: () => ({
        showNavbar: true,
        toggleNavbarHandler: toggleMock
      })
    }))
    const {Search: SearchWithNavbar} = await import(
      '@/components/Search/Search'
    )
    render(<SearchWithNavbar />)
    const input = screen.getByRole('textbox', {name: /Search subreddits/i})
    await user.type(input, 'aww')
    await waitFor(() => {
      expect(screen.getAllByText('r/aww')[0]).toBeInTheDocument()
    })
    const nameNode = screen.getAllByText('r/aww')[0]
    const link = nameNode.closest('a')
    expect(link).toBeTruthy()
    await user.click(link as Element)
    expect(toggleMock).toHaveBeenCalled()
  })
})
