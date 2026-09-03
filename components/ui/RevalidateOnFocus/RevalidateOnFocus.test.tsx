import {render, screen} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import RevalidateOnFocus from './RevalidateOnFocus'

const mockUseRevalidateOnFocus = vi.fn()
vi.mock('@/lib/hooks/useRevalidateOnFocus', () => ({
  useRevalidateOnFocus: () => mockUseRevalidateOnFocus()
}))

describe('RevalidateOnFocus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing and returns null', () => {
    expect(() => render(<RevalidateOnFocus />)).not.toThrow()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls useRevalidateOnFocus on mount', () => {
    render(<RevalidateOnFocus />)

    expect(mockUseRevalidateOnFocus).toHaveBeenCalledTimes(1)
  })
})
