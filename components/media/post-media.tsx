/* eslint-disable @next/next/no-img-element -- Reddit already serves resized renditions and srcsets (design §4.2); the image optimizer would add a hop and a server cache of NSFW media. */
import type { ReactNode } from 'react'
import type {
  AnimatedMedia,
  GalleryItem,
  ImageSet,
  PostMedia as PostMediaView,
  VideoMedia,
} from '@/lib/view-models'
import styles from './media.module.css'

/*
 * Server-rendered media for a post (design §8.7). This is the no-JS baseline:
 * native <img srcset>, native muted loops, and <video> with HLS listed first
 * (Safari plays it with audio) and the MP4 as the fallback. Phase 7 layers the
 * playback islands and embeds on top.
 */

export type RevealReason = 'nsfw' | 'spoiler' | null

const SIZES = '(min-width: 1024px) 40rem, 100vw'

type Props = { media: PostMediaView; title: string; reveal: RevealReason }

export function PostMedia({ media, title, reveal }: Props) {
  if (media.type === 'none') return null
  if (media.type === 'link') {
    // A link card's only media is its thumbnail; hide it rather than wrap the link.
    return <LinkCard {...media} thumbnail={reveal ? null : media.thumbnail} />
  }
  const content = <MediaBody media={media} title={title} />
  return reveal ? (
    <MediaReveal reason={reveal} blurred={blurredOf(media)}>
      {content}
    </MediaReveal>
  ) : (
    content
  )
}

function MediaBody({
  media,
  title,
}: {
  media: Exclude<PostMediaView, { type: 'none' | 'link' }>
  title: string
}) {
  switch (media.type) {
    case 'image':
      return <MediaImage image={media.image} alt={title} />
    case 'animated':
      return <Animated media={media} alt={title} />
    case 'video':
      return <Video media={media} />
    case 'gallery':
      return <Gallery items={media.items} title={title} />
    case 'embed':
      return (
        <LinkCard
          url={media.embed.originalUrl}
          domain={media.embed.provider}
          thumbnail={media.poster}
        />
      )
  }
}

/**
 * NSFW and spoiler reveal (design §8.7): a native <details>. Closed content
 * isn't rendered, so the real media isn't requested until the user reveals it.
 */
export function MediaReveal({
  reason,
  blurred,
  children,
}: {
  reason: 'nsfw' | 'spoiler'
  blurred: { image: ImageSet; blurred: NonNullable<ImageSet['blurred']> } | null
  children: ReactNode
}) {
  return (
    <details className={styles.reveal}>
      <summary className={styles.revealSummary}>
        {blurred ? (
          <img
            className={styles.blurred}
            src={blurred.blurred.src}
            srcSet={blurred.blurred.srcSet}
            sizes={SIZES}
            width={blurred.image.width}
            height={blurred.image.height}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className={styles.placeholder} />
        )}
        <span className={styles.revealLabel}>
          <span className={reason === 'nsfw' ? styles.nsfw : styles.spoiler}>
            {reason === 'nsfw' ? 'NSFW' : 'Spoiler'}
          </span>
          Show
        </span>
      </summary>
      {children}
    </details>
  )
}

export function MediaImage({ image, alt }: { image: ImageSet; alt: string }) {
  return (
    <div className={styles.frame} style={{ aspectRatio: `${image.width} / ${image.height}` }}>
      <img
        className={styles.media}
        src={image.src}
        srcSet={image.srcSet || undefined}
        sizes={SIZES}
        width={image.width}
        height={image.height}
        alt={alt}
        loading="lazy"
        decoding="async"
      />
    </div>
  )
}

function Animated({ media, alt }: { media: AnimatedMedia; alt: string }) {
  if (media.loop) {
    const { mp4, width, height } = media.loop
    return (
      <div className={styles.frame} style={{ aspectRatio: `${width} / ${height}` }}>
        <video
          className={styles.media}
          width={width}
          height={height}
          poster={media.poster?.src}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          aria-label={alt}
        >
          <source src={mp4} type="video/mp4" />
        </video>
      </div>
    )
  }
  const gif = media.gif!
  return (
    <div className={styles.frame} style={{ aspectRatio: `${gif.width} / ${gif.height}` }}>
      <picture>
        {media.poster ? (
          <source media="(prefers-reduced-motion: reduce)" srcSet={media.poster.src} />
        ) : null}
        <img
          className={styles.media}
          src={gif.src}
          width={gif.width}
          height={gif.height}
          alt={alt}
          loading="lazy"
          decoding="async"
        />
      </picture>
    </div>
  )
}

function Video({ media }: { media: VideoMedia }) {
  const { hls, mp4Fallback, width, height } = media.video
  return (
    <div className={styles.frame} style={{ aspectRatio: `${width} / ${height}` }}>
      <video
        className={styles.media}
        width={width}
        height={height}
        poster={media.poster?.src}
        controls
        playsInline
        preload="none"
      >
        <source src={hls} type="application/vnd.apple.mpegurl" />
        {mp4Fallback ? <source src={mp4Fallback} type="video/mp4" /> : null}
      </video>
    </div>
  )
}

/** Scroll-snap strip (design §8.10). Phase 7 adds carousel buttons and the lightbox. */
function Gallery({ items, title }: { items: GalleryItem[]; title: string }) {
  const first = frameOf(items[0]!.media)
  const ratio = Math.min(Math.max(first.width / first.height, 4 / 5), 16 / 9)
  return (
    <ul
      role="list"
      className={styles.gallery}
      style={{ aspectRatio: String(ratio) }}
      aria-label={`Gallery, ${items.length} items`}
      aria-roledescription="carousel"
      tabIndex={0}
    >
      {items.map((item, index) => {
        const label = `${index + 1} of ${items.length}`
        const alt = item.caption ?? `${title}, image ${label}`
        return (
          <li key={index} className={styles.slide} aria-roledescription="slide" aria-label={label}>
            <div className={styles.slideMedia}>
              {item.media.type === 'image' ? (
                <img
                  className={styles.slideImage}
                  src={item.media.image.src}
                  srcSet={item.media.image.srcSet || undefined}
                  sizes={SIZES}
                  width={item.media.image.width}
                  height={item.media.image.height}
                  alt={alt}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              ) : item.media.type === 'animated' ? (
                <Animated media={item.media} alt={alt} />
              ) : (
                <Video media={item.media} />
              )}
            </div>
            <span className={styles.counter}>{label}</span>
            {item.caption || item.outboundUrl ? (
              <p className={styles.caption}>
                {item.caption}
                {item.outboundUrl ? (
                  <>
                    {item.caption ? ' · ' : null}
                    <a
                      href={item.outboundUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow ugc"
                    >
                      {hostOf(item.outboundUrl)} ↗
                    </a>
                  </>
                ) : null}
              </p>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

function LinkCard({
  url,
  domain,
  thumbnail,
}: {
  url: string
  domain: string
  thumbnail: ImageSet | null
}) {
  return (
    <a
      className={styles.linkCard}
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow ugc"
    >
      {thumbnail ? (
        <img
          className={styles.linkThumb}
          src={thumbnail.src}
          srcSet={thumbnail.srcSet || undefined}
          sizes="8rem"
          width={thumbnail.width}
          height={thumbnail.height}
          alt=""
          loading="lazy"
          decoding="async"
        />
      ) : null}
      <span className={styles.linkText}>
        <span className={styles.linkDomain}>{domain} ↗</span>
        <span className={styles.linkUrl}>{url}</span>
      </span>
    </a>
  )
}

function frameOf(media: GalleryItem['media']): { width: number; height: number } {
  switch (media.type) {
    case 'image':
      return media.image
    case 'video':
      return media.video
    case 'animated':
      return media.loop ?? media.gif!
  }
}

function hostOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '')
}

/** The pre-blurred rendition to show behind a reveal, from the media's main image. */
export function blurredOf(
  media: Exclude<PostMediaView, { type: 'none' | 'link' }>,
): { image: ImageSet; blurred: NonNullable<ImageSet['blurred']> } | null {
  const image = primaryImage(media)
  return image?.blurred ? { image, blurred: image.blurred } : null
}

function primaryImage(media: Exclude<PostMediaView, { type: 'none' | 'link' }>): ImageSet | null {
  switch (media.type) {
    case 'image':
      return media.image
    case 'animated':
      return media.poster ?? media.gif
    case 'video':
    case 'embed':
      return media.poster
    case 'gallery':
      return primaryImage(media.items[0]!.media)
  }
}
