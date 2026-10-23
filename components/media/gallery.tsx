/* eslint-disable @next/next/no-img-element -- Reddit already serves resized renditions and srcsets */
import { AutoplayVideo } from '@/components/islands/autoplay-video'
import { GalleryLightbox } from '@/components/islands/gallery-lightbox'
import { RedditVideo } from '@/components/islands/reddit-video'
import type { GalleryItem } from '@/lib/view-models'

import styles from './gallery.module.css'

const SIZES = '(min-width: 1024px) 40rem, 100vw'

/** The frame keeps the first item's shape, within 4:5 and 16:9. */
export function frameRatio(item: GalleryItem): number {
  const media = item.media
  const { width, height } =
    media.type === 'image'
      ? media.image
      : media.type === 'video'
        ? media.video
        : (media.loop ?? media.gif!)
  return Math.min(Math.max(width / height, 4 / 5), 16 / 9)
}

function hostOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '')
}

/**
 * A gallery: a server-rendered scroll-snap strip with CSS
 * Carousel buttons and dots where supported, and a full-screen `<dialog>`
 * whose images load only while it is open. Without JavaScript each
 * image links to its full-size original.
 */
export function Gallery({
  items,
  title,
  postId,
}: {
  items: GalleryItem[]
  title: string
  postId: string
}) {
  const count = items.length
  const altFor = (item: GalleryItem, index: number) =>
    item.caption ?? `${title}, image ${index + 1} of ${count}`

  return (
    <section aria-label={`Gallery: ${title}`} className={styles.gallery} data-gallery={postId}>
      <ul
        aria-label={`Gallery, ${count} items`}
        aria-roledescription="carousel"
        className={styles.track}
        role="region"
        style={{ aspectRatio: String(frameRatio(items[0]!)) }}
        tabIndex={0}
      >
        {items.map((item, index) => (
          <li
            aria-label={`${index + 1} of ${count}`}
            aria-roledescription="slide"
            className={styles.slide}
            key={index}
          >
            <div className={styles.slideMedia}>
              {item.media.type === 'image' ? (
                <a
                  className={styles.open}
                  data-index={index}
                  href={item.media.image.src}
                  rel="noopener"
                  target="_blank"
                >
                  <img
                    alt={altFor(item, index)}
                    className={styles.image}
                    decoding="async"
                    height={item.media.image.height}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    sizes={SIZES}
                    src={item.media.image.src}
                    srcSet={item.media.image.srcSet || undefined}
                    width={item.media.image.width}
                  />
                </a>
              ) : item.media.type === 'animated' && item.media.loop ? (
                <AutoplayVideo
                  height={item.media.loop.height}
                  label={altFor(item, index)}
                  mp4={item.media.loop.mp4}
                  poster={item.media.poster?.src ?? null}
                  width={item.media.loop.width}
                />
              ) : item.media.type === 'animated' ? (
                <img
                  alt={altFor(item, index)}
                  className={styles.image}
                  decoding="async"
                  loading="lazy"
                  src={item.media.gif!.src}
                />
              ) : (
                <RedditVideo
                  height={item.media.video.height}
                  hls={item.media.video.hls}
                  label={altFor(item, index)}
                  mp4Fallback={item.media.video.mp4Fallback}
                  poster={item.media.poster?.src ?? null}
                  width={item.media.video.width}
                />
              )}
            </div>
            <span className={styles.counter}>
              {index + 1} / {count}
            </span>
            {item.caption || item.outboundUrl ? (
              <p className={styles.caption}>
                {item.caption}
                {item.outboundUrl ? (
                  <>
                    {item.caption ? ' · ' : null}
                    <a
                      href={item.outboundUrl}
                      rel="noopener noreferrer nofollow ugc"
                      target="_blank"
                    >
                      {hostOf(item.outboundUrl)} ↗
                    </a>
                  </>
                ) : null}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      <dialog
        aria-label={`${title}, full screen`}
        className={styles.lightbox}
        closedby="any"
        id={`lightbox-${postId}`}
      >
        <ul className={styles.lightboxTrack} tabIndex={-1}>
          {items.map((item, index) =>
            item.media.type === 'image' ? (
              <li className={styles.lightboxSlide} data-index={index} key={index}>
                {/* No `src` until the lightbox opens: `GalleryLightbox` loads these and drops them on close. */}
                <img
                  alt={altFor(item, index)}
                  className={styles.lightboxImage}
                  data-src={item.media.image.src}
                  data-srcset={item.media.image.srcSet || undefined}
                  decoding="async"
                  height={item.media.image.height}
                  loading="lazy"
                  sizes="100vw"
                  width={item.media.image.width}
                />
                <p className={styles.lightboxCaption}>
                  {item.caption ? `${item.caption} · ` : null}
                  <a href={item.media.image.src} rel="noopener" target="_blank">
                    Open original ↗
                  </a>
                </p>
              </li>
            ) : null,
          )}
        </ul>
        <form method="dialog">
          <button aria-label="Close" className={styles.close} type="submit">
            ×
          </button>
        </form>
      </dialog>
      <GalleryLightbox postId={postId} />
    </section>
  )
}
