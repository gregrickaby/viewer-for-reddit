import config from '@/lib/config'
import Link from 'next/link'

/**
 * The header component.
 */
export default function Header() {
  return (
    <header className="flex flex-col space-y-4 text-center">
      <Link href="/" prefetch={false}>
        <h1 className="m-0 p-0">{config.siteName}</h1>
      </Link>
      <p className="m-0 p-0">{config.metaDescription}</p>
    </header>
  )
}
