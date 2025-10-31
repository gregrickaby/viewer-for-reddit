/**
 * Scrolls to the comments section with proper offset for sticky header.
 *
 * @param options - Scroll options
 * @param options.headerHeight - Height of the sticky header in pixels
 * @param options.offset - Additional offset for breathing room in pixels
 * @param options.behavior - Scroll behavior ('smooth' or 'auto')
 */
export function scrollToComments({
  headerHeight = 60,
  offset = 100,
  behavior = 'smooth'
}: {
  headerHeight?: number
  offset?: number
  behavior?: ScrollBehavior
} = {}): boolean {
  if (typeof globalThis === 'undefined') {
    return false
  }

  // Check if hash is present
  if (globalThis.location?.hash !== '#comments') {
    return false
  }

  const commentsElement = globalThis.document?.getElementById('comments')
  if (!commentsElement) {
    return false
  }

  // First scroll to element
  commentsElement.scrollIntoView({
    behavior,
    block: 'start',
    inline: 'nearest'
  })

  // Calculate precise position accounting for sticky header
  const rect = commentsElement.getBoundingClientRect()
  const scrollTop = globalThis.window.scrollY + rect.top - headerHeight - offset

  globalThis.window.scrollTo({
    top: scrollTop,
    behavior
  })

  return true
}
