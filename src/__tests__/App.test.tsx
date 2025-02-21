import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { baseState } from './mocks/testState'
import { renderWithProviders } from './mocks/testUtils'

describe('App', () => {
  it('displays loading state', () => {
    // Prepare the test environment.
    renderWithProviders(<App />, { preloadedState: baseState })

    // Verify the test results.
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})
