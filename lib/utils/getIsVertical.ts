/**
 * Determine if the given width and height indicate a vertical orientation.
 *
 * @param width The width of the media.
 * @param height The height of the media.
 * @returns {boolean} - True if the height is greater than the width, false otherwise.
 */
export function getIsVertical(width?: number, height?: number): boolean {
  return !!(width && height && height > width)
}
