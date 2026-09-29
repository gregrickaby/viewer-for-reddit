import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveMedia } from '@/lib/media/detect'
import { metadataMedia } from '@/lib/media/resolvers/gallery'
import { Link, type RedditLink } from '@/lib/reddit/schemas/link'
import type { PostMedia } from '@/lib/view-models'
import { type Sample, sample, samples } from '@/tests/helpers/fixtures'

type Variant<T extends PostMedia['type']> = Extract<PostMedia, { type: T }>

const post = (
  predicate: (value: Sample) => boolean,
  edit?: (value: Sample) => void,
): RedditLink => {
  const value = sample('Link', predicate)
  edit?.(value)
  return Link.parse(value)
}

function expectType<T extends PostMedia['type']>(media: PostMedia, type: T): Variant<T> {
  expect(media.type).toBe(type)
  return media as Variant<T>
}

const hint = (value: string) => (link: Sample) => link.post_hint === value
const metadata = (predicate: (item: Sample) => boolean) =>
  samples('MediaMetadataItem').filter(predicate)
const isImage = (item: Sample) => item.status === 'valid' && item.e === 'Image'

/** A real gallery post joined back to real media items (the extractor stores them apart). */
function gallery(items: Sample[]): RedditLink {
  return post(
    (value) => value.is_gallery === true && value.over_18 === false,
    (value) => {
      value.gallery_data = {
        items: items.map((item, index) => ({
          media_id: `m${index}`,
          id: index,
          caption: index === 0 ? '  First  ' : '',
          outbound_url: index === 0 ? 'https://example.com/source' : 'javascript:alert(1)',
        })),
      }
      value.media_metadata = Object.fromEntries(items.map((item, index) => [`m${index}`, item]))
    },
  )
}

let info: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  info = vi.spyOn(console, 'info').mockImplementation(() => {})
})

describe('resolveMedia: real posts', () => {
  it('renders an i.redd.it image with a responsive srcset', () => {
    const { image } = expectType(
      resolveMedia(post((v) => hint('image')(v) && v.over_18 === false && v.spoiler === false)),
      'image',
    )
    expect(image.src).toMatch(/^https:\/\/(preview|i)\.redd\.it\//)
    expect(image.width).toBeGreaterThan(0)
    const widths = image.srcSet
      .split(', ')
      .map((entry) => Number(entry.split(' ')[1]!.slice(0, -1)))
    expect(widths).toEqual([...widths].sort((a, b) => a - b))
    expect(image.srcSet).toContain(`${image.width}w`)
  })

  it.each([
    ['NSFW', (v: Sample) => v.over_18 === true && hint('image')(v)],
    ['spoiler', (v: Sample) => v.spoiler === true],
  ])('attaches the pre-blurred rendition to %s images', (_, predicate) => {
    const { image } = expectType(resolveMedia(post(predicate)), 'image')
    expect(image.blurred?.src).toMatch(/^https:\/\/preview\.redd\.it\//)
    expect(image.blurred?.srcSet).not.toBe('')
  })

  it('loops animated previews as MP4, with the GIF and a poster as fallbacks', () => {
    const media = expectType(
      resolveMedia(
        post((v) =>
          Boolean(
            (v.preview as { images: { variants: Sample }[] } | undefined)?.images[0]?.variants.mp4,
          ),
        ),
      ),
      'animated',
    )
    expect(media.loop?.mp4).toMatch(/^https:\/\/preview\.redd\.it\/.+format=mp4/)
    expect(media.gif?.src).toMatch(/^https:\/\/preview\.redd\.it\//)
    expect(media.poster).not.toBeNull()
  })

  it('streams v.redd.it video over HLS with a silent MP4 fallback', () => {
    const { video, poster } = expectType(resolveMedia(post((v) => v.is_video === true)), 'video')
    expect(video.hls).toMatch(/^https:\/\/v\.redd\.it\/.+\.m3u8/)
    expect(video.mp4Fallback).toMatch(/^https:\/\/v\.redd\.it\/.+\.mp4/)
    expect(video.durationSec).toBeGreaterThan(0)
    expect(poster?.src).toBeTruthy()
  })

  it('uses Reddit’s transcode for clips hosted elsewhere (Imgur, Redgifs)', () => {
    const imgur = expectType(resolveMedia(post((v) => v.domain === 'imgur.com')), 'animated')
    expect(imgur.loop?.mp4).toMatch(/^https:\/\/v\.redd\.it\//)
    const redgifs = expectType(resolveMedia(post((v) => v.domain === 'redgifs.com')), 'animated')
    expect(redgifs.poster?.blurred).not.toBeNull()
  })

  it('renders nothing for text posts and removed posts', () => {
    expect(resolveMedia(post((v) => v.is_self === true && !v.removed_by_category))).toEqual({
      type: 'none',
    })
    expect(resolveMedia(post((v) => Boolean(v.removed_by_category)))).toEqual({ type: 'none' })
  })

  it('falls back to a link card and reports media it could not resolve', () => {
    const youtube = expectType(resolveMedia(post((v) => v.domain === 'youtube.com')), 'link')
    expect(youtube.url).toMatch(/^https:\/\/(www\.)?youtube\.com\//)
    expect(youtube.thumbnail?.src).toMatch(/^https:\/\/external-preview\.redd\.it\//)
    expect(info).toHaveBeenCalledWith('[media:unresolved]', {
      domain: 'youtube.com',
      post_hint: 'rich:video',
      media_type: 'youtube.com',
    })
  })

  it('keeps plain links quiet', () => {
    const spotify = expectType(resolveMedia(post((v) => v.domain === 'open.spotify.com')), 'link')
    expect(spotify.domain).toBe('open.spotify.com')
    expect(info).not.toHaveBeenCalled()
  })
})

describe('resolveMedia: crossposts', () => {
  it('resolves through the original post', () => {
    const original = sample('Link', (v) => v.is_video === true)
    const media = resolveMedia(
      post(
        (v) => v.is_self === true && !v.removed_by_category,
        (v) => {
          v.crosspost_parent_list = [original]
        },
      ),
    )
    expect(media.type).toBe('video')
  })

  it('stays empty when the crosspost itself was removed', () => {
    const original = sample('Link', (v) => v.is_video === true)
    const media = resolveMedia(
      post(
        (v) => v.is_self === true,
        (v) => {
          v.removed_by_category = 'moderator'
          v.crosspost_parent_list = [original]
        },
      ),
    )
    expect(media).toEqual({ type: 'none' })
  })
})

describe('resolveMedia: galleries', () => {
  it('keeps order, captions, and safe outbound links', () => {
    const images = metadata(isImage).slice(0, 3)
    const { items } = expectType(resolveMedia(gallery(images)), 'gallery')
    expect(items).toHaveLength(3)
    expect(items[0]).toMatchObject({ caption: 'First', outboundUrl: 'https://example.com/source' })
    expect(items[1]).toMatchObject({ caption: null, outboundUrl: null })
    expect(items.every((item) => item.media.type === 'image')).toBe(true)
  })

  it('skips invalid items and collapses a single survivor to plain media', () => {
    const [image] = metadata(isImage)
    const media = resolveMedia(gallery([{ status: 'failed' }, image!, { status: 'unprocessed' }]))
    expect(media.type).toBe('image')
  })

  it('falls through when no item survives', () => {
    const media = resolveMedia(gallery([{ status: 'failed' }, 'garbage' as unknown as Sample]))
    expect(media.type).not.toBe('gallery')
  })

  it('mixes images, animated GIFs, and video', () => {
    const mixed = [
      metadata(isImage)[0]!,
      metadata((item) => item.e === 'AnimatedImage')[0]!,
      metadata((item) => item.e === 'RedditVideo')[0]!,
    ]
    const { items } = expectType(resolveMedia(gallery(mixed)), 'gallery')
    expect(items.map((item) => item.media.type)).toEqual(['image', 'animated', 'video'])
  })
})

describe('metadataMedia', () => {
  it('turns an uploaded GIF into a silent loop with its GIF and a static poster', () => {
    const media = metadataMedia(metadata((item) => item.e === 'AnimatedImage')[0])
    expect(media).toMatchObject({
      type: 'animated',
      loop: { mp4: expect.stringMatching(/^https:/) },
    })
    expect(media?.type === 'animated' && media.gif?.src).toMatch(/^https:/)
    expect(media?.type === 'animated' && media.poster).not.toBeNull()
  })

  it('handles a Giphy-picker GIF hosted on external-preview.redd.it', () => {
    const giphy = metadata((item) => typeof item.ext === 'string')[0]
    expect(metadataMedia(giphy)?.type).toBe('animated')
  })

  it('streams gallery video over HLS', () => {
    const media = metadataMedia(metadata((item) => item.e === 'RedditVideo')[0])
    expect(media).toMatchObject({ type: 'video', video: { hls: expect.stringContaining('.m3u8') } })
  })

  it('uses Reddit’s obfuscated renditions as the blur', () => {
    const media = metadataMedia(metadata((item) => Array.isArray(item.o) && item.o.length > 0)[0])
    expect(media?.type === 'image' && media.image.blurred).not.toBeNull()
  })

  it.each([
    ['unknown types', { status: 'valid', e: 'Poll' }],
    ['images without renditions', { status: 'valid', e: 'Image' }],
    [
      'images on foreign hosts',
      { status: 'valid', e: 'Image', s: { u: 'https://evil.com/a.jpg', x: 1, y: 1 } },
    ],
    ['animated items without sources', { status: 'valid', e: 'AnimatedImage', s: { x: 1, y: 1 } }],
    ['animated items without anything', { status: 'valid', e: 'AnimatedImage' }],
    [
      'video without dimensions',
      { status: 'valid', e: 'RedditVideo', hlsUrl: 'https://v.redd.it/a.m3u8' },
    ],
    [
      'video on foreign hosts',
      { status: 'valid', e: 'RedditVideo', hlsUrl: 'https://evil.com/a.m3u8', x: 1, y: 1 },
    ],
  ])('rejects %s', (_, value) => {
    expect(metadataMedia(value)).toBeNull()
  })
})

describe('resolveMedia: degraded data', () => {
  const selfPost = (edit: (value: Sample) => void) =>
    resolveMedia(post((v) => v.is_self === true && !v.removed_by_category, edit))

  it('loops a GIF-like v.redd.it upload silently', () => {
    const media = resolveMedia(
      post(
        (v) => v.is_video === true,
        (v) => {
          const video = (v.secure_media as { reddit_video: Sample }).reddit_video
          video.is_gif = true
        },
      ),
    )
    expect(expectType(media, 'animated').loop?.mp4).toMatch(/^https:\/\/v\.redd\.it\//)
  })

  it('skips unusable video and falls through to the next resolver', () => {
    const media = resolveMedia(
      post(
        (v) => v.is_video === true,
        (v) => {
          for (const key of ['media', 'secure_media'] as const) {
            const video = (v[key] as { reddit_video: Sample }).reddit_video
            video.width = 0
          }
        },
      ),
    )
    expect(media.type).not.toBe('video')
  })

  it('does not loop an unusable GIF-like upload', () => {
    const media = resolveMedia(
      post(
        (v) => v.is_video === true,
        (v) => {
          for (const key of ['media', 'secure_media'] as const) {
            const video = (v[key] as { reddit_video: Sample }).reddit_video
            video.is_gif = true
            video.fallback_url = 'https://evil.com/a.mp4'
          }
        },
      ),
    )
    expect(media.type).not.toBe('animated')
  })

  it('uses only the GIF when an animated preview has no usable MP4', () => {
    const media = resolveMedia(
      post(
        (v) =>
          Boolean(
            (v.preview as { images: { variants: Sample }[] } | undefined)?.images[0]?.variants.mp4,
          ),
        (v) => {
          const variants = (v.preview as { images: { variants: Sample }[] }).images[0]!.variants
          delete variants.mp4
        },
      ),
    )
    expect(expectType(media, 'animated')).toMatchObject({ loop: null })
  })

  it('ignores animated variants it cannot use', () => {
    const media = resolveMedia(
      post(
        (v) =>
          Boolean(
            (v.preview as { images: { variants: Sample }[] } | undefined)?.images[0]?.variants.mp4,
          ),
        (v) => {
          const variants = (v.preview as { images: { variants: Record<string, Sample> }[] })
            .images[0]!.variants
          variants.mp4!.source = { url: 'https://evil.com/a.mp4', width: 1, height: 1 }
          delete variants.gif
        },
      ),
    )
    expect(media.type).toBe('image')
  })

  it('treats an image post without a preview as a link with its thumbnail', () => {
    const media = resolveMedia(
      post(hint('image'), (v) => {
        delete v.preview
      }),
    )
    expect(expectType(media, 'link').thumbnail?.src).toMatch(/^https:\/\/[a-z.-]+\.redd\.it\//)
  })

  it('uses an https thumbnail when there is no preview, and ignores sentinels', () => {
    const withThumb = selfPost((v) => {
      v.is_self = false
      v.url = 'https://example.com/story'
      v.thumbnail = 'https://b.thumbs.redditmedia.com/abc.jpg'
      v.thumbnail_width = 140
      v.thumbnail_height = 78
    })
    expect(expectType(withThumb, 'link').thumbnail?.src).toBe(
      'https://b.thumbs.redditmedia.com/abc.jpg',
    )

    const sentinel = selfPost((v) => {
      v.is_self = false
      v.url = 'https://example.com/story'
      v.thumbnail = 'default'
      v.thumbnail_width = 140
      v.thumbnail_height = 78
    })
    expect(expectType(sentinel, 'link').thumbnail).toBeNull()
  })

  it('renders nothing for a link it cannot follow', () => {
    expect(
      selfPost((v) => {
        v.is_self = false
        v.url = 'javascript:alert(1)'
      }),
    ).toEqual({ type: 'none' })
  })
})
