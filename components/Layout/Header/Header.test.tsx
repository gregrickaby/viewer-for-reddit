import {Header} from '@/components/Layout/Header/Header'
import {render, screen} from '@/test-utils'

const mockPush = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: null,
    status: 'unauthenticated',
    update: vi.fn()
  }))
}))

describe('Header', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('renders the header', () => {
    render(<Header />)
    expect(screen.getByText('Viewer for Reddit')).toBeInTheDocument()
  })
})
