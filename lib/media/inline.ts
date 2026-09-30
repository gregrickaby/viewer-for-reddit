import 'server-only'
import type { GalleryItem, ImageSet } from '@/lib/view-models'
import { giphy } from './providers/animated-hosts'
import { metadataMedia } from './resolvers/gallery'
import { REDDIT_MEDIA_HOSTS, safeMediaUrl } from './url'

/*
 * Inline media in self text and comments (design §8.7). Reddit's HTML
 * references uploaded images, GIFs, and Giphy-picker GIFs as plain links whose
 * text is the URL itself. After sanitizing, each such bare link to a known
 * media host becomes inline media. Links with real text stay links. The wrapper
 * is a `<span>`, because Reddit puts these links inside `<p>`, where a
 * `<figure>` isn't allowed.
 *
 * This runs on the sanitizer's canonical output, where an external link is
 * exactly `<a href="…" target="_blank" rel="…">text</a>`, and every URL it
 * emits has passed `safeMediaUrl` for its host.
 */

const BARE_LINK = /<a href="([^"]+)"[^>]*>([^<]*)<\/a>/g
const GIPHY_HOSTS = ['giphy.com', '.giphy.com'] as const
const INLINE_HOSTS = [...REDDIT_MEDIA_HOSTS, ...GIPHY_HOSTS, 'i.imgur.com'] as const
const IMGUR_HOSTS = ['i.imgur.com'] as const

type Inline =
  | {
      kind: 'image'
      src: string
      srcSet: string
      width: number | null
      height: number | null
      full: string
    }
  | {
      kind: 'loop'
      mp4: string
      poster: string | null
      width: number | null
      height: number | null
    }

function decode(value: string): string {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
}

function escape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function fromImageSet(image: ImageSet): Inline {
  return {
    kind: 'image',
    src: image.src,
    srcSet: image.srcSet,
    width: image.width,
    height: image.height,
    full: image.src,
  }
}

function fromMedia(media: GalleryItem['media'] | null): Inline | null {
  if (!media) return null
  if (media.type === 'image') return fromImageSet(media.image)
  if (media.type === 'animated') {
    if (media.loop) {
      return {
        kind: 'loop',
        mp4: media.loop.mp4,
        poster: media.poster?.src ?? null,
        width: media.loop.width,
        height: media.loop.height,
      }
    }
    return media.gif ? fromImageSet(media.gif) : null
  }
  return null
}

/** What a bare link to `href` should show, or null to leave it a link. */
export function inlineFor(href: string, metadata: Record<string, unknown>): Inline | null {
  const url = URL.parse(href)
  if (!url || !safeMediaUrl(href, INLINE_HOSTS)) return null
  const file = url.pathname.split('/').at(-1) ?? ''
  const [id = '', extension = ''] = file.split('.')

  // Uploads: the file name is the media_metadata key.
  if (safeMediaUrl(href, REDDIT_MEDIA_HOSTS)) {
    const known = fromMedia(metadataMedia(metadata[id]))
    if (known) return known
    const src = safeMediaUrl(href)!
    return /^(?:jpe?g|png|webp|gif)$/i.test(extension)
      ? { kind: 'image', src, srcSet: '', width: null, height: null, full: src }
      : null
  }

  if (safeMediaUrl(href, GIPHY_HOSTS)) {
    const giphyId = giphy.parse(url)?.id
    if (!giphyId) return null
    const sized = fromMedia(metadataMedia(metadata[`giphy|${giphyId}`]))
    return {
      kind: 'loop',
      mp4: safeMediaUrl(`https://media.giphy.com/media/${giphyId}/giphy.mp4`, GIPHY_HOSTS)!,
      poster: null,
      width: sized?.width ?? null,
      height: sized?.height ?? null,
    }
  }

  // i.imgur.com
  if (/^(?:gifv|gif|mp4)$/i.test(extension)) {
    const mp4 = safeMediaUrl(`https://i.imgur.com/${id}.mp4`, IMGUR_HOSTS)!
    return { kind: 'loop', mp4, poster: null, width: null, height: null }
  }
  const src = safeMediaUrl(href, IMGUR_HOSTS)!
  return /^(?:jpe?g|png|webp)$/i.test(extension)
    ? { kind: 'image', src, srcSet: '', width: null, height: null, full: src }
    : null
}

function size(inline: Inline): string {
  return inline.width && inline.height ? ` width="${inline.width}" height="${inline.height}"` : ''
}

function render(inline: Inline): string {
  if (inline.kind === 'image') {
    const srcSet = inline.srcSet
      ? ` srcset="${escape(inline.srcSet)}" sizes="(min-width: 40rem) 24rem, 100vw"`
      : ''
    return (
      `<span data-inline-media><a href="${escape(inline.full)}" target="_blank" rel="noopener noreferrer">` +
      `<img src="${escape(inline.src)}"${srcSet}${size(inline)} alt="" loading="lazy" decoding="async"></a></span>`
    )
  }
  const poster = inline.poster ? ` poster="${escape(inline.poster)}"` : ''
  return (
    `<span data-inline-media><video src="${escape(inline.mp4)}"${poster}${size(inline)} ` +
    `muted loop playsinline autoplay preload="metadata"></video></span>`
  )
}

/**
 * Whether sanitized HTML holds inline media. Only `render` above emits the
 * marker: the sanitizer drops `data-*` attributes from Reddit's own markup.
 */
export function hasInlineMedia(html: string): boolean {
  return html.includes('<span data-inline-media>')
}

/** Replaces bare media links in sanitized HTML with inline images and GIF loops. */
export function inlineMedia(
  html: string,
  metadata: Record<string, unknown> | null | undefined,
): string {
  const entries = metadata ?? {}
  return html.replace(BARE_LINK, (link, rawHref: string, rawText: string) => {
    const href = decode(rawHref)
    const text = decode(rawText).trim()
    if (text !== '' && text !== href) return link
    const inline = inlineFor(href, entries)
    return inline ? render(inline) : link
  })
}
