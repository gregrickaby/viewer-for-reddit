import type {RedditPost} from '@/lib/types/reddit'
import {describe, expect, it} from 'vitest'
import {
  decodeImageUrl,
  extractGalleryItems,
  getGiphyVideoUrl,
  getHighestQualityVideoUrl,
  getImgurVideoUrl,
  getMediumImage,
  getPosterImage,
  getRedgifsEmbedUrl,
  isValidThumbnail
} from './media-helpers'

describe('media-helpers', () => {
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

      expect(getMediumImage(post)).toEqual({
        url: 'https://medium.jpg',
        width: 640,
        height: 640
      })
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

      expect(getMediumImage(post)).toEqual({
        url: 'https://large.jpg',
        width: 320,
        height: 320
      })
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

  describe('getHighestQualityVideoUrl', () => {
    it('upgrades DASH_480 to DASH_1080', () => {
      const url = 'https://v.redd.it/abc123/DASH_480.mp4'
      expect(getHighestQualityVideoUrl(url)).toBe(
        'https://v.redd.it/abc123/DASH_1080.mp4'
      )
    })

    it('upgrades DASH_360 to DASH_1080', () => {
      const url = 'https://v.redd.it/xyz789/DASH_360.mp4'
      expect(getHighestQualityVideoUrl(url)).toBe(
        'https://v.redd.it/xyz789/DASH_1080.mp4'
      )
    })

    it('upgrades DASH_720 to DASH_1080', () => {
      const url = 'https://v.redd.it/test/DASH_720.mp4'
      expect(getHighestQualityVideoUrl(url)).toBe(
        'https://v.redd.it/test/DASH_1080.mp4'
      )
    })

    it('upgrades DASH_240 to DASH_1080', () => {
      const url = 'https://v.redd.it/video/DASH_240.mp4'
      expect(getHighestQualityVideoUrl(url)).toBe(
        'https://v.redd.it/video/DASH_1080.mp4'
      )
    })

    it('returns original URL if not a DASH format', () => {
      const url = 'https://v.redd.it/abc123/video.mp4'
      expect(getHighestQualityVideoUrl(url)).toBe(url)
    })

    it('returns original URL if external video', () => {
      const url = 'https://example.com/video.mp4'
      expect(getHighestQualityVideoUrl(url)).toBe(url)
    })

    it('handles URLs with query parameters', () => {
      const url = 'https://v.redd.it/abc123/DASH_480.mp4?source=fallback'
      // Should still work - matches /DASH_xxx.mp4 pattern
      expect(getHighestQualityVideoUrl(url)).toBe(
        'https://v.redd.it/abc123/DASH_1080.mp4?source=fallback'
      )
    })
  })

  describe('getRedgifsEmbedUrl', () => {
    it.each([
      ['watch path', 'https://www.redgifs.com/watch/deadlyimaginarygrub'],
      ['ifr path', 'https://redgifs.com/ifr/deadlyimaginarygrub'],
      [
        'i path with extension',
        'https://www.redgifs.com/i/deadlyimaginarygrub.mp4'
      ],
      ['trailing slash', 'https://www.redgifs.com/watch/deadlyimaginarygrub/']
    ])('builds an ifr embed URL for %s', (_label, url) => {
      expect(getRedgifsEmbedUrl(url)).toBe(
        'https://www.redgifs.com/ifr/deadlyimaginarygrub'
      )
    })

    it('returns null for non-redgifs domains', () => {
      expect(
        getRedgifsEmbedUrl('https://www.youtube.com/watch?v=abc')
      ).toBeNull()
    })

    it('returns null for a lookalike domain', () => {
      expect(getRedgifsEmbedUrl('https://notredgifs.com/watch/abc')).toBeNull()
    })

    it('returns null for a malformed URL', () => {
      expect(getRedgifsEmbedUrl('not-a-url')).toBeNull()
    })

    it('returns null when the path has no id', () => {
      expect(getRedgifsEmbedUrl('https://www.redgifs.com/')).toBeNull()
    })
  })

  describe('getGiphyVideoUrl', () => {
    it.each([
      [
        'giphy.com/gifs/{slug}-{id}',
        'https://giphy.com/gifs/cat-funny-xT0xeJpnrWC4XWblEk'
      ],
      [
        'giphy.com/gifs/{id} with no slug',
        'https://giphy.com/gifs/xT0xeJpnrWC4XWblEk'
      ],
      [
        'media.giphy.com/media/{id}/giphy.gif',
        'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif'
      ],
      [
        'a numbered media subdomain',
        'https://media2.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy-downsized.gif'
      ],
      ['i.giphy.com/{id}.gif', 'https://i.giphy.com/xT0xeJpnrWC4XWblEk.gif']
    ])('builds an mp4 URL for %s', (_label, url) => {
      expect(getGiphyVideoUrl(url)).toBe(
        'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.mp4'
      )
    })

    it('returns null for non-giphy domains', () => {
      expect(getGiphyVideoUrl('https://www.youtube.com/watch?v=abc')).toBeNull()
    })

    it('returns null for a malformed URL', () => {
      expect(getGiphyVideoUrl('not-a-url')).toBeNull()
    })

    it('returns null when the path has no id', () => {
      expect(getGiphyVideoUrl('https://giphy.com/')).toBeNull()
    })
  })

  describe('getImgurVideoUrl', () => {
    it.each([
      ['.gif extension', 'https://i.imgur.com/abc123.gif'],
      ['.gifv extension', 'https://i.imgur.com/abc123.gifv'],
      ['bare imgur.com host', 'https://imgur.com/abc123.gifv']
    ])('builds an mp4 URL for %s', (_label, url) => {
      expect(getImgurVideoUrl(url)).toBe('https://i.imgur.com/abc123.mp4')
    })

    it('returns null for a bare link with no extension (ambiguous)', () => {
      expect(getImgurVideoUrl('https://imgur.com/abc123')).toBeNull()
    })

    it('returns null for a static image extension', () => {
      expect(getImgurVideoUrl('https://i.imgur.com/abc123.jpg')).toBeNull()
    })

    it('returns null for albums', () => {
      expect(getImgurVideoUrl('https://imgur.com/a/abc123')).toBeNull()
    })

    it('returns null for galleries', () => {
      expect(getImgurVideoUrl('https://imgur.com/gallery/abc123')).toBeNull()
    })

    it('returns null for non-imgur domains', () => {
      expect(getImgurVideoUrl('https://www.youtube.com/abc123.gif')).toBeNull()
    })

    it('returns null for a malformed URL', () => {
      expect(getImgurVideoUrl('not-a-url')).toBeNull()
    })
  })

  describe('getPosterImage', () => {
    it('returns preview source URL when available', () => {
      const post = {
        preview: {
          images: [
            {
              source: {
                url: 'https://preview.redd.it/poster.jpg',
                width: 1920,
                height: 1080
              }
            }
          ]
        }
      } as unknown as RedditPost

      expect(getPosterImage(post)).toBe('https://preview.redd.it/poster.jpg')
    })

    it('falls back to valid thumbnail when preview not available', () => {
      const post = {
        thumbnail: 'https://b.thumbs.redditmedia.com/thumb.jpg'
      } as unknown as RedditPost

      expect(getPosterImage(post)).toBe(
        'https://b.thumbs.redditmedia.com/thumb.jpg'
      )
    })

    it.each([
      {
        description: 'returns undefined when thumbnail is "self"',
        post: {thumbnail: 'self'} as unknown as RedditPost
      },
      {
        description: 'returns undefined when thumbnail is "default"',
        post: {thumbnail: 'default'} as unknown as RedditPost
      },
      {
        description: 'returns undefined when no preview or valid thumbnail',
        post: {} as RedditPost
      }
    ])('$description', ({post}) => {
      expect(getPosterImage(post)).toBeUndefined()
    })

    it('prefers preview over thumbnail', () => {
      const post = {
        preview: {
          images: [
            {
              source: {
                url: 'https://preview.redd.it/poster.jpg',
                width: 1920,
                height: 1080
              }
            }
          ]
        },
        thumbnail: 'https://b.thumbs.redditmedia.com/thumb.jpg'
      } as unknown as RedditPost

      expect(getPosterImage(post)).toBe('https://preview.redd.it/poster.jpg')
    })

    it('returns undefined when thumbnail is not a valid URL', () => {
      const post = {
        thumbnail: 'not-a-url'
      } as unknown as RedditPost

      expect(getPosterImage(post)).toBeUndefined()
    })
  })
})
