'use client'

import {GalleryItem} from '@/lib/types/reddit'
import {Carousel} from '@mantine/carousel'
import '@mantine/carousel/styles.css'
import {ActionIcon, Text} from '@mantine/core'
import {IconChevronLeft, IconChevronRight} from '@tabler/icons-react'
import {memo, useRef} from 'react'
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
  const carouselRef = useRef<any>(null)

  if (!items || items.length === 0) {
    return null
  }

  const handlePrev = () => {
    if (carouselRef.current?.embla) {
      carouselRef.current.embla.scrollPrev()
    }
  }

  const handleNext = () => {
    if (carouselRef.current?.embla) {
      carouselRef.current.embla.scrollNext()
    }
  }

  return (
    <div className={styles.galleryWrapper}>
      <Carousel
        ref={carouselRef}
        className={styles.carousel}
        withIndicators
        withControls={false}
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
      {items.length > 1 && (
        <>
          <ActionIcon
            className={styles.customControlPrev}
            onClick={handlePrev}
            aria-label="Previous image"
            size="lg"
            variant="default"
          >
            <IconChevronLeft aria-hidden="true" />
          </ActionIcon>
          <ActionIcon
            className={styles.customControlNext}
            onClick={handleNext}
            aria-label="Next image"
            size="lg"
            variant="default"
          >
            <IconChevronRight aria-hidden="true" />
          </ActionIcon>
        </>
      )}
    </div>
  )
}

export const Gallery = memo(GalleryComponent)
