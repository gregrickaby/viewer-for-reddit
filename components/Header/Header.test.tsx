import {Header} from '@/components/Header/Header'
import {render, screen} from '@/test-utils'

describe('Header', () => {
  it('renders the header', () => {
    render(<Header />)
    expect(screen.getByText('Viewer for Reddit')).toBeInTheDocument()
  })
})
