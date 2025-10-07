import {ResponsiveImage} from '@/components/UI/Post/Media/ResponsiveImage/ResponsiveImage'
import {render, screen} from '@/test-utils'

vi.mock('@mantine/hooks', () => ({
  useInViewport: () => ({ref: vi.fn(), inViewport: true})
}))

vi.mock('@/lib/utils/storage/mediaCache', () => ({
  getCachedUrl: (url: string) => url
}))

describe('ResponsiveImage', () => {
  it('renders image with given src and alt', () => {
    render(<ResponsiveImage src="img.jpg" alt="desc" />)
    const link = screen.getByRole('link', {name: 'view full image'})
    expect(link).toHaveAttribute('href', 'img.jpg')
    const img = screen.getByAltText('desc')
    expect(img).toHaveAttribute('loading', 'eager')
  })
})
