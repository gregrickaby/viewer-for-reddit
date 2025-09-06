import Image from 'next/image'
import NotFoundAnimation from '../../public/not-found.webp'

/**
 * The 404 component.
 */
export default function NotFound() {
  return (
    <div>
      <h1>404 - Not Found</h1>
      <Image alt="Not Found" src={NotFoundAnimation} priority unoptimized />
      <p>The page you&apos;re looking for cannot be found.</p>
    </div>
  )
}
