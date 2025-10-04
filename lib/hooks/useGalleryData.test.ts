import {renderHook} from '@/test-utils/renderHook'
import {describe, expect, it} from 'vitest'
import {useGalleryData} from './useGalleryData'

describe('useGalleryData', () => {
  it('should return null for non-gallery posts', () => {
    const post = {
      id: 't3_test',
      name: 't3_test',
      title: 'Test Post'
    } as any

    const {result} = renderHook(() => useGalleryData(post))
    expect(result.current).toBeNull()
  })

  it('should return null when gallery_data is missing', () => {
    const post = {
      id: 't3_test',
      name: 't3_test',
      title: 'Test Post',
      is_gallery: true
    } as any

    const {result} = renderHook(() => useGalleryData(post))
    expect(result.current).toBeNull()
  })

  it('should return null when media_metadata is missing', () => {
    const post = {
      id: 't3_test',
      name: 't3_test',
      title: 'Test Post',
      is_gallery: true,
      gallery_data: {
        items: [{media_id: 'abc123'}]
      }
    } as any

    const {result} = renderHook(() => useGalleryData(post))
    expect(result.current).toBeNull()
  })

  it('should extract gallery items with source images', () => {
    const post = {
      id: 't3_test',
      name: 't3_test',
      title: 'Gallery Test',
      is_gallery: true,
      gallery_data: {
        items: [
          {media_id: 'abc123', caption: 'First image'},
          {media_id: 'def456'}
        ]
      },
      media_metadata: {
        abc123: {
          s: {
            u: 'https://preview.redd.it/image1.jpg',
            x: 1920,
            y: 1080
          }
        },
        def456: {
          s: {
            u: 'https://preview.redd.it/image2.jpg',
            x: 1280,
            y: 720
          }
        }
      }
    } as any

    const {result} = renderHook(() => useGalleryData(post))
    expect(result.current).toHaveLength(2)
    expect(result.current).toEqual([
      {
        id: 'abc123',
        url: 'https://preview.redd.it/image1.jpg',
        width: 1920,
        height: 1080,
        caption: 'First image'
      },
      {
        id: 'def456',
        url: 'https://preview.redd.it/image2.jpg',
        width: 1280,
        height: 720,
        caption: undefined
      }
    ])
  })

  it('should decode HTML entities in URLs', () => {
    const post = {
      id: 't3_test',
      name: 't3_test',
      title: 'Test',
      is_gallery: true,
      gallery_data: {
        items: [{media_id: 'abc123'}]
      },
      media_metadata: {
        abc123: {
          s: {
            u: 'https://preview.redd.it/image.jpg?width=640&amp;format=png',
            x: 640,
            y: 480
          }
        }
      }
    } as any

    const {result} = renderHook(() => useGalleryData(post))
    expect(result.current?.[0]?.url).toBe(
      'https://preview.redd.it/image.jpg?width=640&format=png'
    )
  })

  it('should use preview images as fallback when source is missing', () => {
    const post = {
      id: 't3_test',
      name: 't3_test',
      title: 'Test',
      is_gallery: true,
      gallery_data: {
        items: [{media_id: 'abc123'}]
      },
      media_metadata: {
        abc123: {
          p: [
            {
              u: 'https://preview.redd.it/small.jpg',
              x: 320,
              y: 240
            },
            {
              u: 'https://preview.redd.it/large.jpg',
              x: 640,
              y: 480
            }
          ]
        }
      }
    } as any

    const {result} = renderHook(() => useGalleryData(post))
    expect(result.current).toHaveLength(1)
    expect(result.current?.[0]).toEqual({
      id: 'abc123',
      url: 'https://preview.redd.it/large.jpg',
      width: 640,
      height: 480,
      caption: undefined
    })
  })

  it('should handle GIF sources', () => {
    const post = {
      id: 't3_test',
      name: 't3_test',
      title: 'Test',
      is_gallery: true,
      gallery_data: {
        items: [{media_id: 'gif123'}]
      },
      media_metadata: {
        gif123: {
          s: {
            gif: 'https://preview.redd.it/animated.gif',
            x: 500,
            y: 500
          }
        }
      }
    } as any

    const {result} = renderHook(() => useGalleryData(post))
    expect(result.current).toHaveLength(1)
    expect(result.current?.[0]?.url).toBe(
      'https://preview.redd.it/animated.gif'
    )
  })

  it('should skip items with missing metadata', () => {
    const post = {
      id: 't3_test',
      name: 't3_test',
      title: 'Test',
      is_gallery: true,
      gallery_data: {
        items: [
          {media_id: 'abc123'},
          {media_id: 'missing'},
          {media_id: 'def456'}
        ]
      },
      media_metadata: {
        abc123: {
          s: {
            u: 'https://preview.redd.it/image1.jpg',
            x: 100,
            y: 100
          }
        },
        def456: {
          s: {
            u: 'https://preview.redd.it/image2.jpg',
            x: 100,
            y: 100
          }
        }
      }
    } as any

    const {result} = renderHook(() => useGalleryData(post))
    expect(result.current).toHaveLength(2)
    expect(result.current?.map((item) => item.id)).toEqual(['abc123', 'def456'])
  })
})
