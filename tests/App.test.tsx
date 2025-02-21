import App from '@/src/App'
import { baseState } from '@/tests/mocks/testState'
import { renderWithProviders } from '@/tests/mocks/testUtils'
import { screen } from '@testing-library/react'

describe('App', () => {
  it('displays loading state', async () => {
    renderWithProviders(<App />, { preloadedState: baseState })

    // Verify the loading state is displayed.
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})
