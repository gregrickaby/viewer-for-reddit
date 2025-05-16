import {debounce} from '@/lib/utils/debounce'
import {useEffect, useRef, useState} from 'react'

export function useYouTubeVideo(threshold: number = 0.25) {
  const ref = useRef<HTMLButtonElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const handleIntersection = debounce(
      (entries: IntersectionObserverEntry[]) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      100
    )

    const observer = new IntersectionObserver(handleIntersection, {
      threshold
    })

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [threshold])

  return {ref, isVisible, setIsVisible}
}
