import {ImageAsset} from '@/lib/types'
import sanitizeHtml from 'sanitize-html'

/**
 * Helper function to get the medium sized image.
 */
export function getMediumImage(images: ImageAsset[]): ImageAsset | null {
  // If there are no images, return null.
  if (!Array.isArray(images) || images.length === 0) {
    return null
  }

  // Find the medium sized image.
  const mediumSize = images.find((res) => res.width === 640)

  // Return the medium size, or the last image if not found.
  return mediumSize ?? images[images.length - 1]
}

/**
 * Helper function to get the time in "___ ago" format.
 */
export function getTimeAgo(timestampInSeconds: number): string {
  // Constants for time conversions.
  const SECOND = 1
  const MINUTE = 60 * SECOND
  const HOUR = 60 * MINUTE
  const DAY = 24 * HOUR
  const MONTH = 30 * DAY
  const YEAR = 12 * MONTH

  // Calculate elapsed time.
  const elapsedSeconds = Math.floor(Date.now() / 1000 - timestampInSeconds)

  // Return the appropriate string.
  if (elapsedSeconds < MINUTE) {
    return 'just now'
  } else if (elapsedSeconds < HOUR) {
    return `${Math.floor(elapsedSeconds / MINUTE)}m ago`
  } else if (elapsedSeconds < DAY) {
    return `${Math.floor(elapsedSeconds / HOUR)}h ago`
  } else if (elapsedSeconds < MONTH) {
    return `${Math.floor(elapsedSeconds / DAY)}d ago`
  } else if (elapsedSeconds < YEAR) {
    return `${Math.floor(elapsedSeconds / MONTH)}mo ago`
  } else {
    return `${Math.floor(elapsedSeconds / YEAR)}y ago`
  }
}

/**
 * Helper function to format a number with commas.
 */
export function formatNumber(number: number): string {
  return new Intl.NumberFormat('en-US').format(number)
}

/**
 * Log an error to the console.
 *
 * @param error Error to log.
 */
export function logError(error: unknown): void {
  if (error instanceof Error) {
    console.error(`Error: ${error.message}`)
  } else {
    console.error(`Error: ${String(error)}`)
  }
}

/**
 * Creates a debounced version of a function.
 *
 * @param func The function to debounce.
 * @param delay The number of milliseconds to delay.
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  delay: number
) {
  let timer: ReturnType<typeof setTimeout>

  return function (...args: Parameters<T>): void {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

/**
 * Sanitize text with sanitize-html and remove any HTML or encoded entities.
 *
 * @param text - The text to sanitize.
 */
/**
 * Sanitize text with sanitize-html and remove any HTML or encoded entities.
 *
 * @param text - The text to sanitize.
 */
export function sanitizeText(text: string): string {
  return sanitizeHtml(text || '', {
    allowedTags: [
      'b',
      'i',
      'strong',
      'em',
      'a',
      'p',
      'br',
      'ul',
      'ol',
      'li',
      'blockquote',
      'code',
      'pre'
    ],
    allowedAttributes: {a: ['href', 'target']},
    parser: {decodeEntities: true}
  })
}
