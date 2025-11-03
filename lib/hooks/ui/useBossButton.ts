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
