/**
 * Root not-found page - handles unmatched URLs.
 * This is shown when Next.js can't find a matching route.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/not-found
 */
import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{padding: '2rem', textAlign: 'center'}}>
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist or has been moved.</p>
      <Link href="/">Go Home</Link>
    </div>
  )
}
