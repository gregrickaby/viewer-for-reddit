'use client'

import {GalleryItem} from '@/lib/types/reddit'
import {Carousel} from '@mantine/carousel'
import '@mantine/carousel/styles.css'
import {Box, Text} from '@mantine/core'
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
 * - Built-in Mantine navigation controls
 * - Dot indicators for current slide
 * - Optional captions per image
 * - Image counter (e.g., "2 / 5")
 * - Lazy loading for performance
 *
 * @example
 * ```typescript
 * <Gallery
 *   items={galleryItems}
 *   title="My Photo Album"
 * />
 * ```
 */
export function Gallery({items, title}: Readonly<GalleryProps>) {
  // Return null if no items
  if (!items || items.length === 0) {
    return null
  }

  // Single item doesn't need carousel
  if (items.length === 1) {
    const item = items[0]
    return (
      <Box className={styles.singleImageWrapper}>
        <Box className={styles.imageContainer}>
          <img
            src={item.url}
            alt={title}
            loading="lazy"
            decoding="async"
            className={styles.image}
          />
        </Box>
        {item.caption && (
          <Text className={styles.caption} size="sm" c="dimmed">
            {item.caption}
          </Text>
        )}
      </Box>
    )
  }

  // Multiple items - use carousel
  return (
    <Box className={styles.galleryWrapper}>
      <Carousel
        withIndicators
        classNames={{
          root: styles.carouselRoot,
          viewport: styles.carouselViewport,
          container: styles.carouselContainer,
          controls: styles.carouselControls,
          control: styles.carouselControl,
          indicators: styles.carouselIndicators,
          indicator: styles.carouselIndicator
        }}
      >
        {items.map((item, index) => (
          <Carousel.Slide key={item.id}>
            <Box className={styles.slideContent}>
              <Box className={styles.imageContainer}>
                <img
                  src={item.url}
                  alt={`${title} - ${index + 1} of ${items.length}`}
                  loading="lazy"
                  decoding="async"
                  className={styles.image}
                />
              </Box>
              {item.caption && (
                <Text className={styles.caption} size="sm" c="dimmed">
                  {item.caption}
                </Text>
              )}
              <Text className={styles.counter} size="xs" c="dimmed" fw={500}>
                {index + 1} / {items.length}
              </Text>
            </Box>
          </Carousel.Slide>
        ))}
      </Carousel>
    </Box>
  )
}
