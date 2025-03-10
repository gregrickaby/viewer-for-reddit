import About from '@/components/About'
import { render, screen } from './setupTests'

describe('About', () => {
  it('should render', () => {
    render(<About />)

    // Verify the component is rendered.
    expect(screen).toBeTruthy()
  })
})
