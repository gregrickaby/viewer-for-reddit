import 'server-only'
import type { RedditLink } from '@/lib/reddit/schemas/link'
import type { EmbedView, ImageSet, PostMedia } from '@/lib/view-models'
import { previewImageSet } from '../images'

/** Every embed iframe gets this sandbox (design §11). */
export const EMBED_SANDBOX = 'allow-scripts allow-same-origin allow-presentation allow-popups'

/** The default `allow` list for video players. */
export const VIDEO_ALLOW = 'autoplay; encrypted-media; picture-in-picture; fullscreen'

/** The best poster Reddit gives us: its preview of the post. */
export function posterOf(link: RedditLink): ImageSet | null {
  return previewImageSet(link.preview?.images[0])
}

/** The media's shape from Reddit's preview or oEmbed data, or `fallback`. */
export function aspectOf(link: RedditLink, fallback = 16 / 9): number {
  const oembed = (link.secure_media ?? link.media)?.oembed
  if (oembed?.width && oembed.height) return oembed.width / oembed.height
  const source = link.preview?.images[0]?.source
  return source && source.width > 0 && source.height > 0 ? source.width / source.height : fallback
}

export type EmbedOptions = Pick<EmbedView, 'provider' | 'iframeSrc'> &
  Partial<Pick<EmbedView, 'aspectRatio' | 'height' | 'allow'>> & { poster?: ImageSet | null }

/** A click-to-load embed for a post (rendered by `EmbedFacade`). */
export function embed(link: RedditLink, options: EmbedOptions): PostMedia {
  return {
    type: 'embed',
    poster: options.poster === undefined ? posterOf(link) : options.poster,
    embed: {
      provider: options.provider,
      title: link.title,
      iframeSrc: options.iframeSrc,
      aspectRatio: options.aspectRatio ?? aspectOf(link),
      height: options.height ?? null,
      allow: options.allow ?? VIDEO_ALLOW,
      sandbox: EMBED_SANDBOX,
      originalUrl: link.url_overridden_by_dest ?? link.url,
    },
  }
}

/** The last non-empty path segment, e.g. `abc` for `/watch/abc/`. */
export function lastSegment(url: URL): string {
  return url.pathname.split('/').filter(Boolean).at(-1) ?? ''
}
