import {debounce} from '@/lib/functions' // Import your reusable debounce function
import {useEffect, useMemo, useRef, useState} from 'react'

/**
 * YouTubePlayer component for lazy loading YouTube videos.
 *
 * @param {string} videoId - The YouTube video ID to display.
 */
export default function YouTubePlayer({videoId}: Readonly<{videoId: string}>) {
  const [isVisible, setIsVisible] = useState(false)
  const videoRef = useRef<HTMLDivElement>(null)

  // Function to get the YouTube thumbnail image URL.
  const thumbnailUrl = useMemo(
    () => `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    [videoId]
  )

  /**
   * Effect to observe when the video enters the viewport.
   *
   * Loads the YouTube iframe once 25% of the video is visible.
   * Debounced using the reusable debounce function to avoid excessive observer callbacks.
   */
  useEffect(() => {
    // Debounced function to handle the intersection observer.
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
      threshold: 0.25
    })

    if (videoRef.current) {
      observer.observe(videoRef.current)
    }

    // Cleanup the observer on unmount.
    return () => {
      if (videoRef.current) {
        observer.disconnect()
      }
    }
  }, [])

  return (
    <div
      ref={videoRef}
      style={{
        position: 'relative',
        paddingBottom: '56.25%',
        height: 0,
        overflow: 'hidden'
      }}
    >
      {isVisible ? (
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          height="100%"
          loading="lazy"
          src={`https://www.youtube.com/embed/${videoId}`}
          style={{position: 'absolute', top: 0, left: 0}}
          title="YouTube video player"
          width="100%"
        />
      ) : (
        <img
          alt="YouTube video thumbnail"
          onClick={() => setIsVisible(true)}
          src={thumbnailUrl}
          style={{width: '100%', height: 'auto', cursor: 'pointer'}}
        />
      )}
    </div>
  )
}
