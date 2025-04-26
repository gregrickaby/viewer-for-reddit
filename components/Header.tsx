import config from '@/lib/config'
import Link from 'next/link'
import classes from './Header.module.css'

/**
 * The header component.
 */
export default function Header() {
  return (
    <header className={classes.header}>
      <Link href="/" prefetch={false}>
        <h1>{config.siteName}</h1>
      </Link>
      <p>{config.metaDescription}</p>
    </header>
  )
}
