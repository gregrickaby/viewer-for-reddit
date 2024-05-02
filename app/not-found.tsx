import notFound from '@/public/not-found.webp'
import Image from 'next/image'

/**
 * The 404 component.
 */
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <h1 className="mb-0">404 - Not Found</h1>
      <Image alt="Not Found" src={notFound} priority />
      <p>The page you&apos;re looking for cannot be found.</p>
    </div>
  )
}
