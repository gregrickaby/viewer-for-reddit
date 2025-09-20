import {Header} from '@/components/Header/Header'
import {render, screen} from '@/test-utils'

const mockPush = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
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
