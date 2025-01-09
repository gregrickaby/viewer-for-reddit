'use client'

import {useEffect} from 'react'

/**
 * AdSense component.
 */
export default function AdSense() {
  useEffect(() => {
    // Initialize ads after script is loaded
    if ((window as any).adsbygoogle) {
      try {
        ;(window as any).adsbygoogle.push({})
      } catch (e) {
        console.error('Adsense error:', e)
      }
    }
  }, [])

  return (
    <ins
      className="adsbygoogle"
      style={{display: 'block'}}
      data-ad-client="ca-pub-1715669502587007"
      data-ad-slot="1111111111"
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
  )
}
