import {Settings} from '@/components/UI/Settings/Settings'
import {render, screen, waitFor} from '@/test-utils'
import userEvent from '@testing-library/user-event'

const user = userEvent.setup()

const mocks = vi.hoisted(() => ({
  showNotification: vi.fn()
}))

vi.mock('@mantine/notifications', () => ({
  showNotification: mocks.showNotification
}))

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should toggle switches', async () => {
    render(<Settings />)

    await user.click(screen.getByTestId('settings-button'))
    await waitFor(() => {
      expect(screen.getByText('Preferences')).toBeInTheDocument()
    })

    const nsfwSwitch = screen.getByTestId('nsfw-switch')
    const darkModeSwitch = screen.getByTestId('dark-mode-switch')
    const muteSwitch = screen.getByTestId('mute-switch')

    await user.click(nsfwSwitch)
    await user.click(darkModeSwitch)
    await user.click(darkModeSwitch)
    await user.click(muteSwitch)

    expect(nsfwSwitch).not.toBeChecked()
    expect(darkModeSwitch).not.toBeChecked()
    expect(muteSwitch).not.toBeChecked()
  })

  it('should clear recent viewing history', async () => {
    render(<Settings />)

    await user.click(screen.getByTestId('settings-button'))
    await waitFor(() => {
      expect(screen.getByText('Preferences')).toBeInTheDocument()
    })

    const clearRecentButton = screen.getByTestId('clear-recent-button')
    await user.click(clearRecentButton)

    expect(mocks.showNotification).toHaveBeenCalledWith({
      title: 'Success',
      message: 'All recent viewing history has been removed.',
      color: 'green'
    })
  })

  it('should clear search history', async () => {
    render(<Settings />)

    await user.click(screen.getByTestId('settings-button'))
    await waitFor(() => {
      expect(screen.getByText('Preferences')).toBeInTheDocument()
    })

    const clearSearchHistoryButton = screen.getByTestId(
      'clear-search-history-button'
    )
    await user.click(clearSearchHistoryButton)

    expect(mocks.showNotification).toHaveBeenCalledWith({
      title: 'Success',
      message: 'Search history has been removed.',
      color: 'green'
    })
  })

  it('should clear favorites', async () => {
    render(<Settings />)

    await user.click(screen.getByTestId('settings-button'))
    await waitFor(() => {
      expect(screen.getByText('Preferences')).toBeInTheDocument()
    })

    const clearFavoritesButton = screen.getByTestId('clear-favorites-button')
    await user.click(clearFavoritesButton)

    expect(mocks.showNotification).toHaveBeenCalledWith({
      title: 'Success',
      message:
        'All favorites have been removed. You can always add them again.',
      color: 'green'
    })
  })

  it('should reset all settings', async () => {
    render(<Settings />)

    await user.click(screen.getByTestId('settings-button'))
    await waitFor(() => {
      expect(screen.getByText('Preferences')).toBeInTheDocument()
    })

    const resetAllButton = screen.getByTestId('reset-all-button')
    await user.click(resetAllButton)

    expect(mocks.showNotification).toHaveBeenCalledWith({
      title: 'Success',
      message:
        'All settings, viewing & search history, and favorites have been removed.',
      color: 'green'
    })
  })
})
