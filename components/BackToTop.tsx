import Link from 'next/link'

/**
 * Back to top button component.
 */
export default function BackToTop() {
  return (
    <Link href="/">
      <a aria-label="go back to top">
        <span>&uarr;</span>
      </a>
    </Link>
  )
}
