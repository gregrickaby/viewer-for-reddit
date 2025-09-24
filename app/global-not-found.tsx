import {logError} from '@/lib/utils/logError'
import type {Metadata} from 'next'
import {headers} from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import NotFoundAnimation from '../public/not-found.webp'
import Snoo from './icon.png'

export const metadata: Metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for does not exist.'
}

/**
 * The Global 404 component.
 */
export default async function GlobalNotFound() {
  const headersList = await headers()
  const referer = headersList.get('referer') ?? 'unknown'
  logError(`404 Not Found: ${referer}`)

  return (
    <html lang="en">
      <body
        style={{fontFamily: 'sans-serif', textAlign: 'center', padding: '2rem'}}
      >
        <Link href="/">
          <Image alt="" src={Snoo} height={64} width={64} />
        </Link>
        <h1>404 - Not Found</h1>
        <Image alt="Not Found" src={NotFoundAnimation} priority unoptimized />
        <p>The page you&apos;re looking for cannot be found.</p>
        <Link href="/">Go back home</Link>
      </body>
    </html>
  )
}
