/* eslint-disable @next/next/no-img-element -- Reddit already serves resized renditions and srcsets (design §4.2); the image optimizer would add a hop and a server cache of NSFW media. */
import type { ReactNode } from 'react'
import { setBlurNsfw } from '@/app/actions/settings'
import { AutoplayVideo } from '@/components/islands/autoplay-video'
import { EmbedFacade } from '@/components/islands/embed-facade'
import { RedditVideo } from '@/components/islands/reddit-video'
import { formAction } from '@/lib/actions/form-action'
import { Gallery } from './gallery'
import type {
  AnimatedMedia,
  ImageSet,
  PostMedia as PostMediaView,
  ProviderId,
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

const PROVIDER_NAMES: Record<ProviderId, string> = {
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  streamable: 'Streamable',
  twitch: 'Twitch',
  redgifs: 'Redgifs',
  giphy: 'Giphy',
  imgur: 'Imgur',
  tiktok: 'TikTok',
  spotify: 'Spotify',
  soundcloud: 'SoundCloud',
}

type Props = { media: PostMediaView; title: string; reveal: RevealReason; postId: string }

export function PostMedia({ media, title, reveal, postId }: Props) {
  if (media.type === 'none') return null
  if (media.type === 'link') {
    // A link card's only media is its thumbnail; hide it rather than wrap the link.
    return <LinkCard {...media} thumbnail={reveal ? null : media.thumbnail} />
  }
  const content = <MediaBody media={media} title={title} postId={postId} />
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
  postId,
}: {
  media: Exclude<PostMediaView, { type: 'none' | 'link' }>
  title: string
  postId: string
}) {
  switch (media.type) {
    case 'image':
      return <MediaImage image={media.image} alt={title} />
    case 'animated':
      return <Animated media={media} alt={title} />
    case 'video':
      return <Video media={media} label={title} />
    case 'gallery':
      return <Gallery items={media.items} title={title} postId={postId} />
    case 'embed':
      return (
        <EmbedFacade
          {...media.embed}
          providerName={PROVIDER_NAMES[media.embed.provider]}
          poster={media.poster?.src ?? null}
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
  const details = (
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
  if (reason !== 'nsfw') return details
  // One click to stop blurring for good, right where the blur is (also in Settings).
  return (
    <div className={styles.revealGroup}>
      {details}
      <form action={formAction(setBlurNsfw)} className={styles.unblur}>
        <input type="hidden" name="blur" value="off" />
        <button type="submit" className={styles.unblurButton}>
          Stop blurring NSFW media
        </button>
      </form>
    </div>
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
    return (
      <AutoplayVideo
        mp4={media.loop.mp4}
        width={media.loop.width}
        height={media.loop.height}
        poster={media.poster?.src ?? null}
        label={alt}
      />
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

function Video({ media, label }: { media: VideoMedia; label: string }) {
  return (
    <RedditVideo
      hls={media.video.hls}
      mp4Fallback={media.video.mp4Fallback}
      width={media.video.width}
      height={media.video.height}
      poster={media.poster?.src ?? null}
      label={label}
    />
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
