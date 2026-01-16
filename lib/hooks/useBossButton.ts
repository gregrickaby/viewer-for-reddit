/**
 * Hook for "boss button" functionality.
 * Shows a button after scrolling that navigates to a different site when clicked or when Escape is pressed.
 * Useful for quickly hiding Reddit content when needed.
 *
 * Features:
 * - Auto-shows after scrolling past 200px
 * - Keyboard shortcut (Escape key)
 * - Memoized button text for performance
 *
 * @param redirectUrl - URL to navigate to when activated
 * @returns Object containing visibility state, URL, and button text
 *
 * @example
 * ```typescript
 * const {shouldShow, redirectUrl, buttonText} = useBossButton('https://duckduckgo.com')
 *
 * {shouldShow && (
 *   <Button onClick={() => router.push(redirectUrl)}>
 *     Hide
 *   </Button>
 * )}
 * ```
 */
import {useWindowScroll} from '@mantine/hooks'
import {useRouter} from 'next/navigation'
import {useEffect, useMemo} from 'react'

export function useBossButton(redirectUrl: string) {
  const router = useRouter()
  const [scroll] = useWindowScroll()

  const buttonText = useMemo(
    () =>
      'The boss button. Click or press Escape to instantly navigate to DuckDuckGo.',
    []
  )

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.push(redirectUrl)
      }
    }

    globalThis.window.addEventListener('keydown', handleKeydown)
    return () => globalThis.window.removeEventListener('keydown', handleKeydown)
  }, [router, redirectUrl])

  return {
    shouldShow: scroll.y > 200,
    redirectUrl,
    buttonText
  }
}
