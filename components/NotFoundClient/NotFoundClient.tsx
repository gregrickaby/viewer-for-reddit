'use client'

import {logClientError} from '@/lib/utils/clientLogger'
import {sanitizeLocationData} from '@/lib/utils/urlSanitizer'
import Image from 'next/image'
import Link from 'next/link'
import {useEffect} from 'react'

interface NotFoundClientProps {
  readonly serverHeaders: Record<string, string | null>
}

export function NotFoundClient({serverHeaders}: Readonly<NotFoundClientProps>) {
  useEffect(() => {
    // Capture comprehensive client-side route and request details
    const locationData = sanitizeLocationData({
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      href: window.location.href,
      origin: window.location.origin,
      host: window.location.host,
      hostname: window.location.hostname,
      port: window.location.port,
      protocol: window.location.protocol
    })

    const clientDetails = {
      // Client-side route information (most important!) - sanitized
      ...locationData,

      // Browser/document information
      referrer: document.referrer,
      title: document.title,
      // Truncate user agent to avoid fingerprinting concerns
      userAgent: navigator.userAgent.substring(0, 200),
      language: navigator.language,
      // Limit languages array to avoid excessive data
      languages: navigator.languages.slice(0, 3),
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,

      // Screen/viewport info
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,

      // Timing information
      timestamp: new Date().toISOString(),

      // Server-side headers for comparison
      serverHeaders
    }

    logClientError('404 Page Not Found - Client Side', {
      component: 'NotFoundClient',
      action: '404',
      ...clientDetails,
      context: 'Client-side 404 with full route and browser context'
    })
  }, [serverHeaders])

  return (
    <html lang="en">
      <body
        style={{fontFamily: 'sans-serif', textAlign: 'center', padding: '2rem'}}
      >
        <Link href="/">
          <Image alt="" src="/icon.png" height={64} width={64} />
        </Link>
        <h1>404 - Not Found</h1>
        <Image alt="Not Found" src="/not-found.webp" priority unoptimized />
        <p>The page you&apos;re looking for cannot be found.</p>
        <Link href="/">Go back home</Link>
      </body>
    </html>
  )
}
