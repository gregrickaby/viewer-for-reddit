'use client'

import {logClientError} from '@/lib/utils/logging/clientLogger'
import {sanitizeLocationData} from '@/lib/utils/validation/text/urlSanitizer'
import Image from 'next/image'
import Link from 'next/link'
import {useEffect} from 'react'
import Snoo from '../../../app/icon.png'
import NotFoundAnimation from '../../../public/not-found.webp'

interface NotFoundClientProps {
  readonly serverHeaders: Record<string, string | null>
}

/**
 * NotFoundClient Component.
 *
 * Renders a custom 404 Not Found page and logs detailed client-side context for debugging.
 */
export function NotFoundClient({serverHeaders}: Readonly<NotFoundClientProps>) {
  const pathname =
    globalThis.window === undefined ? '' : globalThis.window.location.pathname

  useEffect(() => {
    // Capture comprehensive client-side route and request details
    const locationData = sanitizeLocationData({
      pathname: globalThis.window.location.pathname,
      search: globalThis.window.location.search,
      hash: globalThis.window.location.hash,
      href: globalThis.window.location.href,
      origin: globalThis.window.location.origin,
      host: globalThis.window.location.host,
      hostname: globalThis.window.location.hostname,
      port: globalThis.window.location.port,
      protocol: globalThis.window.location.protocol
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
      screenWidth: globalThis.window.screen.width,
      screenHeight: globalThis.window.screen.height,
      viewportWidth: globalThis.window.innerWidth,
      viewportHeight: globalThis.window.innerHeight,

      // Timing information
      timestamp: new Date().toISOString(),

      // Server-side headers for comparison
      serverHeaders
    }

    logClientError(
      `404 Page Not Found: ${locationData.pathname || globalThis.window.location.pathname}`,
      {
        component: 'NotFoundClient',
        action: '404',
        ...clientDetails,
        context: 'Client-side 404 with full route and browser context'
      }
    )
  }, [serverHeaders])

  return (
    <html lang="en">
      <head>
        <style>
          {`
            :root {
              color-scheme: light dark;
            }

            body {
              align-items: center;
              background-color: light-dark(#ffffff, #242424);
              color: light-dark(#242424, #ffffff);
              display: flex;
              flex-direction: column;
              font-family: sans-serif;
              gap: 1rem;
              padding: 2rem;
              text-align: center;
            }

            code {
              background-color: light-dark(#f5f5f5, #1a1a1a);
              border-radius: 4px;
              font-family: monospace;
              font-size: 0.9em;
              padding: 0.2rem 0.4rem;
            }

            .home {
              border-radius: 10px;
              border: 1px solid light-dark(#242424, #ffffff);
              color: light-dark(#242424, #ffffff);
              font-weight: bold;
              padding: 1rem 2rem;
              text-decoration: none;
              transition: background-color 0.3s, color 0.3s;

              &:hover {
                background-color: light-dark(#242424, #ffffff);
                color: light-dark(#ffffff, #242424);
              }
            }
          `}
        </style>
      </head>
      <body>
        <Link href="/" data-umami-event="404 logo">
          <Image alt="Reddit Logo" src={Snoo} height={64} width={64} />
        </Link>
        <h1>404 - Not Found</h1>
        <Image alt="Not Found" src={NotFoundAnimation} priority unoptimized />
        <p>
          The page <code>{pathname}</code> cannot be found.
        </p>
        <Link className="home" href="/" data-umami-event="404 go home link">
          Go to homepage
        </Link>
      </body>
    </html>
  )
}
