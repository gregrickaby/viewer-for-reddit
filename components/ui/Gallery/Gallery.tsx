'use client'

import {GalleryItem} from '@/lib/types/reddit'
import {Carousel} from '@mantine/carousel'
import '@mantine/carousel/styles.css'
import {Text} from '@mantine/core'
import {memo} from 'react'
import styles from './Gallery.module.css'

/**
 * Props for the Gallery component.
 */
interface GalleryProps {
  /** Array of gallery images */
  items: GalleryItem[]
  /** Post title for alt text */
  title: string
}

/**
 * Display a carousel gallery of images from a Reddit gallery post.
 * Uses Mantine Carousel for swipeable image navigation.
 *
 * Features:
 * - Swipeable carousel navigation
 * - Dot indicators for current slide
 * - Optional captions per image
 * - Image counter (e.g., "2 / 5")
 * - Lazy loading with blur placeholders
 * - Memoized for performance
 *
 * @example
 * ```typescript
 * <Gallery
 *   items={galleryItems}
 *   title="My Photo Album"
 * />
 * ```
 */
function GalleryComponent({items, title}: Readonly<GalleryProps>) {
  if (!items || items.length === 0) {
    return null
  }

  return (
    <Carousel
      className={styles.carousel}
      withIndicators
      withControls={items.length > 1}
      classNames={{
        root: styles.carouselRoot,
        controls: styles.carouselControls,
        control: styles.carouselControl,
        indicators: styles.carouselIndicators,
        indicator: styles.carouselIndicator
      }}
    >
      {items.map((item, index) => (
        <Carousel.Slide key={item.id} className={styles.slide}>
          <div className={styles.imageContainer}>
            <img
              src={item.url}
              alt={`${title} - ${index + 1} of ${items.length}`}
              loading="lazy"
              decoding="async"
              className={styles.image}
            />
            {item.caption && (
              <Text className={styles.caption} size="sm">
                {item.caption}
              </Text>
            )}
          </div>
          {items.length > 1 && (
            <Text className={styles.counter} size="sm" c="dimmed">
              {index + 1} / {items.length}
            </Text>
          )}
        </Carousel.Slide>
      ))}
    </Carousel>
  )
}

export const Gallery = memo(GalleryComponent)
