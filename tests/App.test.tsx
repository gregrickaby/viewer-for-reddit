import App from '@/src/App'
import { baseState } from '@/tests/mocks/testState'
import { renderWithProviders } from '@/tests/mocks/testUtils'
import { screen, waitFor } from '@testing-library/react'

describe('App', () => {
  it('displays loading state', async () => {
    renderWithProviders(<App />, { preloadedState: baseState })

    await waitFor(() => {
      // Verify the loading state is displayed.
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })

  it('displays content after loading', async () => {
    renderWithProviders(<App />, { preloadedState: baseState })

    await waitFor(() => {
      // Verify the loading state is not displayed.
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })

    // Verify the content is displayed.
    expect(
      screen.getByText(/I can't look at this without smiling/i)
    ).toBeInTheDocument()
  })
})
