'use client'

import type {GalleryItem} from '@/lib/hooks/useGalleryData'
import {Carousel} from '@mantine/carousel'
import '@mantine/carousel/styles.css'
import {Image, Text} from '@mantine/core'
import classes from './Gallery.module.css'

export interface GalleryProps {
  items: GalleryItem[]
  title: string
}

/**
 * Gallery component for displaying Reddit image galleries.
 *
 * Features:
 * - Carousel with navigation arrows
 * - Dot indicators showing current position
 * - Touch/swipe support for mobile
 * - Lazy loading for performance
 * - Responsive image sizing
 * - Accessibility support
 *
 * @param items - Array of gallery items with image URLs and metadata
 * @param title - Post title for alt text accessibility
 * @returns JSX.Element carousel gallery
 */
export function Gallery({items, title}: Readonly<GalleryProps>) {
  if (!items || items.length === 0) {
    return null
  }

  return (
    <Carousel
      className={classes.carousel}
      withIndicators
      withControls={items.length > 1}
      classNames={{
        root: classes.carouselRoot,
        controls: classes.carouselControls,
        control: classes.carouselControl,
        indicators: classes.carouselIndicators,
        indicator: classes.carouselIndicator
      }}
    >
      {items.map((item, index) => (
        <Carousel.Slide key={item.id} className={classes.slide}>
          <div className={classes.imageContainer}>
            <Image
              src={item.url}
              alt={`${title} - Image ${index + 1} of ${items.length}`}
              fit="contain"
              className={classes.image}
              loading="lazy"
            />
            {item.caption && (
              <Text className={classes.caption} size="sm">
                {item.caption}
              </Text>
            )}
          </div>
          {items.length > 1 && (
            <Text className={classes.counter} size="sm" c="dimmed">
              {index + 1} / {items.length}
            </Text>
          )}
        </Carousel.Slide>
      ))}
    </Carousel>
  )
}
