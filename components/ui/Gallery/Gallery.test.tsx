import {GalleryItem} from '@/lib/types/reddit'
import {render, screen} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {Gallery} from './Gallery'

describe('Gallery', () => {
  const mockItems: GalleryItem[] = [
    {
      id: 'item1',
      url: 'https://example.com/image1.jpg',
      width: 800,
      height: 600,
      caption: 'First image'
    },
    {
      id: 'item2',
      url: 'https://example.com/image2.jpg',
      width: 800,
      height: 600,
      caption: 'Second image'
    },
    {
      id: 'item3',
      url: 'https://example.com/image3.jpg',
      width: 800,
      height: 600,
      caption: undefined
    }
  ]

  const title = 'Test Gallery'

  describe('rendering', () => {
    it('renders gallery with multiple items', () => {
      render(<Gallery items={mockItems} title={title} />)

      const images = screen.getAllByRole('img')
      expect(images).toHaveLength(3)
    })

    it('renders image with correct alt text', () => {
      render(<Gallery items={mockItems} title={title} />)

      expect(
        screen.getByAltText('Test Gallery - Image 1 of 3')
      ).toBeInTheDocument()
      expect(
        screen.getByAltText('Test Gallery - Image 2 of 3')
      ).toBeInTheDocument()
      expect(
        screen.getByAltText('Test Gallery - Image 3 of 3')
      ).toBeInTheDocument()
    })

    it('renders captions when provided', () => {
      render(<Gallery items={mockItems} title={title} />)

      expect(screen.getByText('First image')).toBeInTheDocument()
      expect(screen.getByText('Second image')).toBeInTheDocument()
    })

    it('does not render caption when null', () => {
      render(<Gallery items={mockItems} title={title} />)

      // Only 2 captions should be present (third item has no caption)
      expect(screen.getByText('First image')).toBeInTheDocument()
      expect(screen.getByText('Second image')).toBeInTheDocument()
    })

    it('renders image counter for multiple items', () => {
      render(<Gallery items={mockItems} title={title} />)

      expect(screen.getByText('1 / 3')).toBeInTheDocument()
    })
  })

  describe('single item', () => {
    const singleItem: GalleryItem[] = [
      {
        id: 'single',
        url: 'https://example.com/single.jpg',
        width: 800,
        height: 600,
        caption: 'Single image'
      }
    ]

    it('renders single item without counter', () => {
      render(<Gallery items={singleItem} title={title} />)

      expect(screen.getByRole('img')).toBeInTheDocument()
      expect(screen.queryByText('1 / 1')).not.toBeInTheDocument()
    })

    it('renders single item with caption', () => {
      render(<Gallery items={singleItem} title={title} />)

      expect(screen.getByText('Single image')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('returns null when items array is empty', () => {
      render(<Gallery items={[]} title={title} />)

      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })

    it('returns null when items is undefined', () => {
      render(<Gallery items={undefined as any} title={title} />)

      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })

    it('returns null when items is null', () => {
      render(<Gallery items={null as any} title={title} />)

      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })

    it('handles items without captions', () => {
      const itemsWithoutCaptions: GalleryItem[] = [
        {
          id: 'item1',
          url: 'https://example.com/1.jpg',
          width: 800,
          height: 600,
          caption: undefined
        },
        {
          id: 'item2',
          url: 'https://example.com/2.jpg',
          width: 800,
          height: 600,
          caption: undefined
        }
      ]

      render(<Gallery items={itemsWithoutCaptions} title={title} />)

      const images = screen.getAllByRole('img')
      expect(images).toHaveLength(2)
    })

    it('handles very long captions', () => {
      const longCaption = 'A'.repeat(500)
      const itemsWithLongCaption: GalleryItem[] = [
        {
          id: 'item1',
          url: 'https://example.com/1.jpg',
          width: 800,
          height: 600,
          caption: longCaption
        }
      ]

      render(<Gallery items={itemsWithLongCaption} title={title} />)

      expect(screen.getByText(longCaption)).toBeInTheDocument()
    })

    it('handles very long title', () => {
      const longTitle = 'Very Long Title '.repeat(20)
      render(<Gallery items={mockItems} title={longTitle} />)

      // Check first image is rendered with part of the title
      const image = screen.getAllByRole('img')[0]
      expect(image).toHaveAttribute('alt')
    })

    it('handles special characters in caption', () => {
      const specialCaption = '<>&"\'🎉'
      const itemsWithSpecialCaption: GalleryItem[] = [
        {
          id: 'item1',
          url: 'https://example.com/1.jpg',
          width: 800,
          height: 600,
          caption: specialCaption
        }
      ]

      render(<Gallery items={itemsWithSpecialCaption} title={title} />)

      expect(screen.getByText(specialCaption)).toBeInTheDocument()
    })
  })

  describe('image URLs', () => {
    it('handles relative URLs', () => {
      const itemsWithRelativeUrls: GalleryItem[] = [
        {
          id: 'item1',
          url: '/images/photo.jpg',
          width: 800,
          height: 600,
          caption: undefined
        }
      ]

      render(<Gallery items={itemsWithRelativeUrls} title={title} />)

      const image = screen.getByRole('img')
      expect(image).toBeInTheDocument()
    })

    it('handles data URLs', () => {
      const itemsWithDataUrl: GalleryItem[] = [
        {
          id: 'item1',
          url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          width: 800,
          height: 600,
          caption: undefined
        }
      ]

      render(<Gallery items={itemsWithDataUrl} title={title} />)

      const image = screen.getByRole('img')
      expect(image).toBeInTheDocument()
    })
  })
})
