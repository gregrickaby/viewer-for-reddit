/* eslint-disable @next/next/no-img-element -- Reddit already serves resized renditions and srcsets; the image optimizer would add a hop and a server cache of NSFW media. */
import type { ReactNode } from 'react'

import { AutoplayVideo } from '@/components/islands/autoplay-video'
import { EmbedFacade } from '@/components/islands/embed-facade'
import { RedditVideo } from '@/components/islands/reddit-video'
import type {
  AnimatedMedia,
  ImageSet,
  PostMedia as PostMediaView,
  ProviderId,
  VideoMedia,
} from '@/lib/view-models'

import { Gallery } from './gallery'
import styles from './media.module.css'

/*
 * Server-rendered media for a post. This is the no-JS baseline:
 * native <img srcset>, native muted loops, and <video> with HLS listed first
 * (Safari plays it with audio) and the MP4 as the fallback. The playback
 * islands and embeds layer on top.
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

interface Props {
  media: PostMediaView
  title: string
  reveal: RevealReason
  postId: string
}

export function PostMedia({ media, title, reveal, postId }: Props) {
  if (media.type === 'none') return null
  if (media.type === 'link') {
    // A link card's only media is its thumbnail; hide it rather than wrap the link.
    return <LinkCard {...media} thumbnail={reveal ? null : media.thumbnail} />
  }
  const content = <MediaBody media={media} postId={postId} title={title} />
  return reveal ? (
    <MediaReveal blurred={blurredOf(media)} reason={reveal}>
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
      return <MediaImage alt={title} image={media.image} />
    case 'animated':
      return <Animated alt={title} media={media} />
    case 'video':
      return <Video label={title} media={media} />
    case 'gallery':
      return <Gallery items={media.items} postId={postId} title={title} />
    case 'embed':
      return (
        <EmbedFacade
          {...media.embed}
          poster={media.poster?.src ?? null}
          providerName={PROVIDER_NAMES[media.embed.provider]}
        />
      )
  }
}

/**
 * NSFW and spoiler reveal: a native <details>. Closed content
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
            alt=""
            className={styles.blurred}
            decoding="async"
            height={blurred.image.height}
            loading="lazy"
            sizes={SIZES}
            src={blurred.blurred.src}
            srcSet={blurred.blurred.srcSet}
            width={blurred.image.width}
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
        alt={alt}
        className={styles.media}
        decoding="async"
        height={image.height}
        loading="lazy"
        sizes={SIZES}
        src={image.src}
        srcSet={image.srcSet || undefined}
        width={image.width}
      />
    </div>
  )
}

function Animated({ media, alt }: { media: AnimatedMedia; alt: string }) {
  if (media.loop) {
    return (
      <AutoplayVideo
        height={media.loop.height}
        label={alt}
        mp4={media.loop.mp4}
        poster={media.poster?.src ?? null}
        width={media.loop.width}
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
          alt={alt}
          className={styles.media}
          decoding="async"
          height={gif.height}
          loading="lazy"
          src={gif.src}
          width={gif.width}
        />
      </picture>
    </div>
  )
}

function Video({ media, label }: { media: VideoMedia; label: string }) {
  return (
    <RedditVideo
      height={media.video.height}
      hls={media.video.hls}
      label={label}
      mp4Fallback={media.video.mp4Fallback}
      poster={media.poster?.src ?? null}
      width={media.video.width}
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
      rel="noopener noreferrer nofollow ugc"
      target="_blank"
    >
      {thumbnail ? (
        <img
          alt=""
          className={styles.linkThumb}
          decoding="async"
          height={thumbnail.height}
          loading="lazy"
          sizes="8rem"
          src={thumbnail.src}
          srcSet={thumbnail.srcSet || undefined}
          width={thumbnail.width}
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
