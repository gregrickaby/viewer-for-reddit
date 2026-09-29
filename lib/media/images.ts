import 'server-only'
import type { RedditMediaMetadataItem, RedditPreviewImage } from '@/lib/reddit/schemas/media'
import type { ImageSet, LoopVideo } from '@/lib/view-models'
import { REDDIT_MEDIA_HOSTS, safeMediaUrl } from './url'

/** A single image rendition, normalized from Reddit's two spellings. */
export type Rendition = { url: string; width: number; height: number }

type Renditions = { source: Rendition; resolutions: readonly Rendition[] }

/**
 * Builds an `ImageSet` from a source and its downscaled resolutions. Unsafe
 * or dimensionless renditions are dropped; an unusable source means no image.
 */
export function imageSet(
  source: Rendition,
  resolutions: readonly Rendition[] = [],
  blurred: Renditions | null = null,
  hosts: readonly string[] = REDDIT_MEDIA_HOSTS,
): ImageSet | null {
  const src = safeMediaUrl(source.url, hosts)
  if (!src || !hasSize(source)) return null
  return {
    src,
    srcSet: srcSet([...resolutions, source], hosts),
    width: source.width,
    height: source.height,
    blurred: blurredSet(blurred),
  }
}

/** `preview.images[i]`, with Reddit's pre-blurred variant when it has one. */
export function previewImageSet(image: RedditPreviewImage | undefined): ImageSet | null {
  if (!image) return null
  const blurred = image.variants?.obfuscated ?? image.variants?.nsfw ?? null
  return imageSet(image.source, image.resolutions, blurred)
}

/**
 * A `media_metadata` item as an image: the full-size `s.u` when present,
 * otherwise (animated items) the largest static preview in `p`.
 */
export function metadataImageSet(item: RedditMediaMetadataItem): ImageSet | null {
  const previews = (item.p ?? []).map(fromMetadata)
  const source = item.s?.u
    ? fromMetadata({ u: item.s.u, x: item.s.x, y: item.s.y })
    : previews.at(-1)
  if (!source) return null
  return imageSet(source, previews, largestFirst((item.o ?? []).map(fromMetadata)))
}

/** An animated item's GIF as an image, for browsers that get no MP4 loop. */
export function metadataGifSet(item: RedditMediaMetadataItem): ImageSet | null {
  const source = item.s
  return source?.gif ? imageSet({ url: source.gif, width: source.x, height: source.y }) : null
}

export function loopVideo(
  url: string | undefined,
  width: number,
  height: number,
  hosts: readonly string[] = REDDIT_MEDIA_HOSTS,
): LoopVideo | null {
  const mp4 = safeMediaUrl(url, hosts)
  return mp4 && hasSize({ width, height }) ? { mp4, width, height } : null
}

function fromMetadata(rendition: { u: string; x: number; y: number }): Rendition {
  return { url: rendition.u, width: rendition.x, height: rendition.y }
}

/** Reddit lists `o` smallest first; the last entry is the blur source. */
function largestFirst(renditions: Rendition[]): Renditions | null {
  const source = renditions.at(-1)
  return source ? { source, resolutions: renditions.slice(0, -1) } : null
}

function blurredSet(renditions: Renditions | null): ImageSet['blurred'] {
  if (!renditions) return null
  const src = safeMediaUrl(renditions.source.url)
  return src ? { src, srcSet: srcSet([...renditions.resolutions, renditions.source]) } : null
}

function srcSet(
  renditions: readonly Rendition[],
  hosts: readonly string[] = REDDIT_MEDIA_HOSTS,
): string {
  const byWidth = new Map<number, string>()
  for (const rendition of renditions) {
    const url = safeMediaUrl(rendition.url, hosts)
    if (url && hasSize(rendition) && !byWidth.has(rendition.width))
      byWidth.set(rendition.width, url)
  }
  return [...byWidth]
    .sort(([a], [b]) => a - b)
    .map(([width, url]) => `${url} ${width}w`)
    .join(', ')
}

function hasSize(rendition: { width: number; height: number }): boolean {
  return rendition.width > 0 && rendition.height > 0
}
