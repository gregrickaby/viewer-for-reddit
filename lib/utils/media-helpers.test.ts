import type {RedditPost} from '@/lib/types/reddit'
import {describe, expect, it} from 'vitest'
import {
  decodeImageUrl,
  extractGalleryItems,
  getMediumImage,
  getMp4Variant,
  isValidThumbnail,
  isValidUrl,
  isVerticalImage
} from './media-helpers'

describe('media-helpers', () => {
  describe('isValidUrl', () => {
    it('accepts valid Reddit URLs', () => {
      expect(isValidUrl('https://i.redd.it/abc123.jpg')).toBe(true)
      expect(isValidUrl('https://v.redd.it/video123')).toBe(true)
      expect(isValidUrl('https://preview.redd.it/image.png')).toBe(true)
      expect(isValidUrl('https://external-preview.redd.it/image.jpg')).toBe(
        true
      )
      expect(isValidUrl('https://www.reddit.com/r/test')).toBe(true)
      expect(isValidUrl('https://old.reddit.com/r/test')).toBe(true)
    })

    it('accepts subdomains of allowed domains', () => {
      expect(isValidUrl('https://preview.redd.it/image.png')).toBe(true)
      expect(isValidUrl('https://external-preview.redd.it/image.jpg')).toBe(
        true
      )
    })

    it('rejects non-HTTP(S) protocols', () => {
      expect(isValidUrl('ftp://example.com/file.txt')).toBe(false)
      expect(isValidUrl('data:text/html,<script>alert("xss")</script>')).toBe(
        false
      )
      expect(isValidUrl('file:///etc/passwd')).toBe(false)
    })

    it('rejects URLs from disallowed domains', () => {
      expect(isValidUrl('https://evil.com/malicious.jpg')).toBe(false)
      expect(isValidUrl('https://example.com/image.png')).toBe(false)
    })

    it('rejects invalid URLs', () => {
      expect(isValidUrl('not a url')).toBe(false)
      expect(isValidUrl('')).toBe(false)
      expect(isValidUrl('://invalid')).toBe(false)
    })

    it('is case-insensitive for domain checking', () => {
      expect(isValidUrl('https://I.REDD.IT/ABC123.jpg')).toBe(true)
      expect(isValidUrl('https://V.REDD.IT/video123')).toBe(true)
    })
  })

  describe('getMediumImage', () => {
    it('returns 640px resolution when available', () => {
      const post = {
        preview: {
          images: [
            {
              resolutions: [
                {width: 108, height: 108, url: 'https://small.jpg'},
                {width: 216, height: 216, url: 'https://medium-small.jpg'},
                {width: 640, height: 640, url: 'https://medium.jpg'},
                {width: 960, height: 960, url: 'https://large.jpg'}
              ]
            }
          ]
        }
      } as unknown as RedditPost

      expect(getMediumImage(post)).toBe('https://medium.jpg')
    })

    it('returns largest resolution when 640px not found', () => {
      const post = {
        preview: {
          images: [
            {
              resolutions: [
                {width: 108, height: 108, url: 'https://small.jpg'},
                {width: 216, height: 216, url: 'https://medium.jpg'},
                {width: 320, height: 320, url: 'https://large.jpg'}
              ]
            }
          ]
        }
      } as unknown as RedditPost

      expect(getMediumImage(post)).toBe('https://large.jpg')
    })

    it('returns null when no preview exists', () => {
      const post = {} as RedditPost

      expect(getMediumImage(post)).toBeNull()
    })

    it('returns null when images array is empty', () => {
      const post = {
        preview: {
          images: []
        }
      } as unknown as RedditPost

      expect(getMediumImage(post)).toBeNull()
    })

    it('returns null when resolutions array is empty', () => {
      const post = {
        preview: {
          images: [
            {
              resolutions: []
            }
          ]
        }
      } as unknown as RedditPost

      expect(getMediumImage(post)).toBeNull()
    })

    it('returns null when resolutions is not an array', () => {
      const post = {
        preview: {
          images: [
            {
              resolutions: null
            }
          ]
        }
      } as unknown as RedditPost

      expect(getMediumImage(post)).toBeNull()
    })

    it('handles undefined url in resolution', () => {
      const post = {
        preview: {
          images: [
            {
              resolutions: [{width: 640, height: 640, url: undefined}]
            }
          ]
        }
      } as unknown as RedditPost

      expect(getMediumImage(post)).toBeNull()
    })
  })

  describe('decodeImageUrl', () => {
    it('decodes double-encoded ampersands', () => {
      const url =
        'https://preview.redd.it/image.jpg?width=640&amp;format=png&amp;auto=webp'
      const expected =
        'https://preview.redd.it/image.jpg?width=640&format=png&auto=webp'

      expect(decodeImageUrl(url)).toBe(expected)
    })

    it('handles URLs without encoded characters', () => {
      const url = 'https://i.redd.it/abc123.jpg'

      expect(decodeImageUrl(url)).toBe(url)
    })

    it('decodes multiple occurrences', () => {
      const url = 'test&amp;test&amp;test'
      const expected = 'test&test&test'

      expect(decodeImageUrl(url)).toBe(expected)
    })

    it('handles empty string', () => {
      expect(decodeImageUrl('')).toBe('')
    })
  })

  describe('getMp4Variant', () => {
    it('returns MP4 URL from preview variants', () => {
      const post = {
        preview: {
          images: [
            {
              variants: {
                mp4: {
                  source: {
                    url: 'https://preview.redd.it/video.mp4'
                  }
                }
              }
            }
          ]
        }
      } as unknown as RedditPost

      expect(getMp4Variant(post)).toBe('https://preview.redd.it/video.mp4')
    })

    it('decodes URL with HTML entities', () => {
      const post = {
        preview: {
          images: [
            {
              variants: {
                mp4: {
                  source: {
                    url: 'https://preview.redd.it/video.mp4?param=1&amp;param=2'
                  }
                }
              }
            }
          ]
        }
      } as unknown as RedditPost

      expect(getMp4Variant(post)).toBe(
        'https://preview.redd.it/video.mp4?param=1&param=2'
      )
    })

    it('returns null when no preview exists', () => {
      const post = {} as RedditPost

      expect(getMp4Variant(post)).toBeNull()
    })

    it('returns null when no MP4 variant exists', () => {
      const post = {
        preview: {
          images: [
            {
              variants: {}
            }
          ]
        }
      } as unknown as RedditPost

      expect(getMp4Variant(post)).toBeNull()
    })

    it('returns null when MP4 source URL is undefined', () => {
      const post = {
        preview: {
          images: [
            {
              variants: {
                mp4: {
                  source: {}
                }
              }
            }
          ]
        }
      } as unknown as RedditPost

      expect(getMp4Variant(post)).toBeNull()
    })
  })

  describe('isVerticalImage', () => {
    it('returns true when height is greater than width', () => {
      expect(isVerticalImage(1080, 1920)).toBe(true)
    })

    it('returns false when width is greater than height', () => {
      expect(isVerticalImage(1920, 1080)).toBe(false)
    })

    it('returns false when width equals height', () => {
      expect(isVerticalImage(1080, 1080)).toBe(false)
    })

    it('returns false when width is undefined', () => {
      expect(isVerticalImage(undefined, 1920)).toBe(false)
    })

    it('returns false when height is undefined', () => {
      expect(isVerticalImage(1080, undefined)).toBe(false)
    })

    it('returns false when both are undefined', () => {
      expect(isVerticalImage(undefined, undefined)).toBe(false)
    })

    it('returns false when width is zero', () => {
      expect(isVerticalImage(0, 1920)).toBe(false)
    })

    it('returns false when height is zero', () => {
      expect(isVerticalImage(1080, 0)).toBe(false)
    })
  })

  describe('isValidThumbnail', () => {
    it('returns true for valid HTTP thumbnail URLs', () => {
      expect(isValidThumbnail('https://i.redd.it/thumb.jpg')).toBe(true)
      expect(isValidThumbnail('http://example.com/thumb.png')).toBe(true)
    })

    it('returns false for "self" thumbnail', () => {
      expect(isValidThumbnail('self')).toBe(false)
    })

    it('returns false for "default" thumbnail', () => {
      expect(isValidThumbnail('default')).toBe(false)
    })

    it('returns false for non-HTTP URLs', () => {
      expect(isValidThumbnail('ftp://example.com/thumb.jpg')).toBe(false)
      expect(isValidThumbnail('data:image/png;base64,abc')).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isValidThumbnail(undefined)).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isValidThumbnail('')).toBe(false)
    })
  })

  describe('extractGalleryItems', () => {
    it('extracts gallery items with all data', () => {
      const post = {
        is_gallery: true,
        gallery_data: {
          items: [
            {media_id: 'img1', caption: 'First image'},
            {media_id: 'img2', caption: 'Second image'}
          ]
        },
        media_metadata: {
          img1: {
            s: {
              u: 'https://i.redd.it/img1.jpg',
              x: 1920,
              y: 1080
            }
          },
          img2: {
            s: {
              u: 'https://i.redd.it/img2.jpg',
              x: 1080,
              y: 1920
            }
          }
        }
      } as unknown as RedditPost

      const items = extractGalleryItems(post)

      expect(items).toHaveLength(2)
      expect(items?.[0]).toEqual({
        id: 'img1',
        url: 'https://i.redd.it/img1.jpg',
        width: 1920,
        height: 1080,
        caption: 'First image'
      })
      expect(items?.[1]).toEqual({
        id: 'img2',
        url: 'https://i.redd.it/img2.jpg',
        width: 1080,
        height: 1920,
        caption: 'Second image'
      })
    })

    it('extracts GIF from metadata', () => {
      const post = {
        is_gallery: true,
        gallery_data: {
          items: [{media_id: 'gif1'}]
        },
        media_metadata: {
          gif1: {
            s: {
              gif: 'https://i.redd.it/gif1.gif',
              x: 500,
              y: 500
            }
          }
        }
      } as unknown as RedditPost

      const items = extractGalleryItems(post)

      expect(items).toHaveLength(1)
      expect(items?.[0].url).toBe('https://i.redd.it/gif1.gif')
    })

    it('falls back to preview when source not available', () => {
      const post = {
        is_gallery: true,
        gallery_data: {
          items: [{media_id: 'img1'}]
        },
        media_metadata: {
          img1: {
            s: {},
            p: [
              {u: 'https://preview.redd.it/small.jpg', x: 320, y: 240},
              {u: 'https://preview.redd.it/large.jpg', x: 1920, y: 1080}
            ]
          }
        }
      } as unknown as RedditPost

      const items = extractGalleryItems(post)

      expect(items).toHaveLength(1)
      expect(items?.[0].url).toBe('https://preview.redd.it/large.jpg')
      expect(items?.[0].width).toBe(1920)
      expect(items?.[0].height).toBe(1080)
    })

    it('decodes HTML entities in URLs', () => {
      const post = {
        is_gallery: true,
        gallery_data: {
          items: [{media_id: 'img1'}]
        },
        media_metadata: {
          img1: {
            s: {
              u: 'https://i.redd.it/img.jpg?w=640&amp;h=480',
              x: 640,
              y: 480
            }
          }
        }
      } as unknown as RedditPost

      const items = extractGalleryItems(post)

      expect(items?.[0].url).toBe('https://i.redd.it/img.jpg?w=640&h=480')
    })

    it('returns null when not a gallery', () => {
      const post = {
        is_gallery: false
      } as unknown as RedditPost

      expect(extractGalleryItems(post)).toBeNull()
    })

    it('returns null when gallery_data is missing', () => {
      const post = {
        is_gallery: true,
        media_metadata: {}
      } as unknown as RedditPost

      expect(extractGalleryItems(post)).toBeNull()
    })

    it('returns null when media_metadata is missing', () => {
      const post = {
        is_gallery: true,
        gallery_data: {
          items: [{media_id: 'img1'}]
        }
      } as unknown as RedditPost

      expect(extractGalleryItems(post)).toBeNull()
    })

    it('skips items with missing metadata', () => {
      const post = {
        is_gallery: true,
        gallery_data: {
          items: [{media_id: 'img1'}, {media_id: 'missing'}]
        },
        media_metadata: {
          img1: {
            s: {
              u: 'https://i.redd.it/img1.jpg',
              x: 1920,
              y: 1080
            }
          }
        }
      } as unknown as RedditPost

      const items = extractGalleryItems(post)

      expect(items).toHaveLength(1)
      expect(items?.[0].id).toBe('img1')
    })

    it('skips items without image URL', () => {
      const post = {
        is_gallery: true,
        gallery_data: {
          items: [{media_id: 'img1'}]
        },
        media_metadata: {
          img1: {
            s: {
              x: 1920,
              y: 1080
            }
          }
        }
      } as unknown as RedditPost

      const items = extractGalleryItems(post)

      expect(items).toBeNull()
    })

    it('returns null when all items are skipped', () => {
      const post = {
        is_gallery: true,
        gallery_data: {
          items: [{media_id: 'missing1'}, {media_id: 'missing2'}]
        },
        media_metadata: {}
      } as unknown as RedditPost

      const items = extractGalleryItems(post)

      expect(items).toBeNull()
    })

    it('handles items without captions', () => {
      const post = {
        is_gallery: true,
        gallery_data: {
          items: [{media_id: 'img1'}]
        },
        media_metadata: {
          img1: {
            s: {
              u: 'https://i.redd.it/img1.jpg',
              x: 1920,
              y: 1080
            }
          }
        }
      } as unknown as RedditPost

      const items = extractGalleryItems(post)

      expect(items?.[0].caption).toBeUndefined()
    })

    it('defaults dimensions to 0 when missing', () => {
      const post = {
        is_gallery: true,
        gallery_data: {
          items: [{media_id: 'img1'}]
        },
        media_metadata: {
          img1: {
            s: {
              u: 'https://i.redd.it/img1.jpg'
            }
          }
        }
      } as unknown as RedditPost

      const items = extractGalleryItems(post)

      expect(items?.[0].width).toBe(0)
      expect(items?.[0].height).toBe(0)
    })
  })
})
