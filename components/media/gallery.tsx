/* eslint-disable @next/next/no-img-element -- Reddit already serves resized renditions and srcsets (design §4.2) */
import { AutoplayVideo } from '@/components/islands/autoplay-video'
import { GalleryLightbox } from '@/components/islands/gallery-lightbox'
import { RedditVideo } from '@/components/islands/reddit-video'
import type { GalleryItem } from '@/lib/view-models'
import styles from './gallery.module.css'

const SIZES = '(min-width: 1024px) 40rem, 100vw'

/** The frame keeps the first item's shape, within 4:5 and 16:9 (design §8.10). */
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
 * A gallery (design §8.10): a server-rendered scroll-snap strip with CSS
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
    <section className={styles.gallery} data-gallery={postId} aria-label={`Gallery: ${title}`}>
      <ul
        className={styles.track}
        role="region"
        aria-roledescription="carousel"
        aria-label={`Gallery, ${count} items`}
        tabIndex={0}
        style={{ aspectRatio: String(frameRatio(items[0]!)) }}
      >
        {items.map((item, index) => (
          <li
            key={index}
            className={styles.slide}
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${count}`}
          >
            <div className={styles.slideMedia}>
              {item.media.type === 'image' ? (
                <a
                  href={item.media.image.src}
                  target="_blank"
                  rel="noopener"
                  data-index={index}
                  className={styles.open}
                >
                  <img
                    className={styles.image}
                    src={item.media.image.src}
                    srcSet={item.media.image.srcSet || undefined}
                    sizes={SIZES}
                    width={item.media.image.width}
                    height={item.media.image.height}
                    alt={altFor(item, index)}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                </a>
              ) : item.media.type === 'animated' && item.media.loop ? (
                <AutoplayVideo
                  mp4={item.media.loop.mp4}
                  width={item.media.loop.width}
                  height={item.media.loop.height}
                  poster={item.media.poster?.src ?? null}
                  label={altFor(item, index)}
                />
              ) : item.media.type === 'animated' ? (
                <img
                  className={styles.image}
                  src={item.media.gif!.src}
                  alt={altFor(item, index)}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <RedditVideo
                  hls={item.media.video.hls}
                  mp4Fallback={item.media.video.mp4Fallback}
                  width={item.media.video.width}
                  height={item.media.video.height}
                  poster={item.media.poster?.src ?? null}
                  label={altFor(item, index)}
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
        ))}
      </ul>

      <dialog
        id={`lightbox-${postId}`}
        closedby="any"
        className={styles.lightbox}
        aria-label={`${title}, full screen`}
      >
        <ul className={styles.lightboxTrack} tabIndex={-1}>
          {items.map((item, index) =>
            item.media.type === 'image' ? (
              <li key={index} className={styles.lightboxSlide} data-index={index}>
                {/* No `src` until the lightbox opens: `GalleryLightbox` loads these and drops them on close. */}
                <img
                  className={styles.lightboxImage}
                  data-src={item.media.image.src}
                  data-srcset={item.media.image.srcSet || undefined}
                  sizes="100vw"
                  width={item.media.image.width}
                  height={item.media.image.height}
                  alt={altFor(item, index)}
                  loading="lazy"
                  decoding="async"
                />
                <p className={styles.lightboxCaption}>
                  {item.caption ? `${item.caption} · ` : null}
                  <a href={item.media.image.src} target="_blank" rel="noopener">
                    Open original ↗
                  </a>
                </p>
              </li>
            ) : null,
          )}
        </ul>
        <form method="dialog">
          <button type="submit" className={styles.close} aria-label="Close">
            ×
          </button>
        </form>
      </dialog>
      <GalleryLightbox postId={postId} />
    </section>
  )
}
