import {ResponsiveImage} from '@/components/UI/Post/Media/ResponsiveImage/ResponsiveImage'
import {fireEvent, render, screen} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const mockUseInViewport = vi.fn()

vi.mock('@mantine/hooks', () => ({
  useInViewport: () => mockUseInViewport()
}))

vi.mock('@/lib/utils/storage/mediaCache', () => ({
  getCachedUrl: (url: string) => url
}))

describe('ResponsiveImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseInViewport.mockReturnValue({ref: vi.fn(), inViewport: true})
  })

  it('should render image with given src and alt', () => {
    render(<ResponsiveImage src="img.jpg" alt="desc" />)
    const link = screen.getByRole('link', {name: 'view full image'})
    expect(link).toHaveAttribute('href', 'img.jpg')
    const img = screen.getByAltText('desc')
    expect(img).toHaveAttribute('loading', 'eager')
  })

  it('should handle null src gracefully', () => {
    render(<ResponsiveImage src={null} alt="test" />)
    const link = screen.getByLabelText('view full image')
    expect(link).toHaveAttribute('href', '')
  })

  it('should handle undefined src gracefully', () => {
    render(<ResponsiveImage src={undefined} alt="test" />)
    const link = screen.getByLabelText('view full image')
    expect(link).toHaveAttribute('href', '')
  })

  it('should use lazy loading when not in viewport', () => {
    mockUseInViewport.mockReturnValue({ref: vi.fn(), inViewport: false})
    render(<ResponsiveImage src="img.jpg" alt="test" />)
    const img = screen.getByAltText('test')
    expect(img).toHaveAttribute('loading', 'lazy')
  })

  it('should decode HTML entities in src URL', () => {
    render(<ResponsiveImage src="url?param=1&amp;other=2" alt="test" />)
    const link = screen.getByRole('link', {name: 'view full image'})
    expect(link).toHaveAttribute('href', 'url?param=1&other=2')
  })

  it('should set object-fit to cover for square images on load', () => {
    render(<ResponsiveImage src="square.jpg" alt="test" />)
    const img = screen.getByAltText('test')

    Object.defineProperty(img, 'naturalWidth', {
      value: 100,
      configurable: true
    })
    Object.defineProperty(img, 'naturalHeight', {
      value: 100,
      configurable: true
    })

    fireEvent.load(img)

    expect(img).toHaveStyle({objectFit: 'cover'})
  })

  it('should set object-fit to contain for wide images on load', () => {
    render(<ResponsiveImage src="wide.jpg" alt="test" />)
    const img = screen.getByAltText('test')

    Object.defineProperty(img, 'naturalWidth', {
      value: 200,
      configurable: true
    })
    Object.defineProperty(img, 'naturalHeight', {
      value: 100,
      configurable: true
    })

    fireEvent.load(img)

    expect(img).toHaveStyle({objectFit: 'contain'})
  })

  it('should set object-fit to contain for tall images on load', () => {
    render(<ResponsiveImage src="tall.jpg" alt="test" />)
    const img = screen.getByAltText('test')

    Object.defineProperty(img, 'naturalWidth', {
      value: 100,
      configurable: true
    })
    Object.defineProperty(img, 'naturalHeight', {
      value: 200,
      configurable: true
    })

    fireEvent.load(img)

    expect(img).toHaveStyle({objectFit: 'contain'})
  })

  it('should not change object-fit when img ref is null', () => {
    render(<ResponsiveImage src="test.jpg" alt="test" />)
    const img = screen.getByAltText('test')

    Object.defineProperty(img, 'naturalWidth', {value: undefined})
    Object.defineProperty(img, 'naturalHeight', {value: undefined})

    fireEvent.load(img)

    expect(img).toHaveStyle({objectFit: 'contain'})
  })

  it('should render with empty alt text when not provided', () => {
    render(<ResponsiveImage src="img.jpg" />)
    const img = screen.getByAltText('')
    expect(img).toBeInTheDocument()
  })
})
