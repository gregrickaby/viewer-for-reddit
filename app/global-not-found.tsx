import Image from 'next/image'
import Link from 'next/link'
import NotFoundAnimation from '../public/not-found.webp'
import Snoo from './icon.png'

/**
 * The Global 404 component.
 */
export default function GlobalNotFound() {
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
