import Link from 'next/link'

/**
 * Back to top button component.
 */
export default function BackToTop() {
  return (
    <Link href="/">
      <a
        aria-label="go back to top"
        className="fixed bottom-0 right-0 mr-4 mb-16 rounded-lg bg-black py-3 px-5 hover:no-underline"
      >
        <span className="text-white">&uarr;</span>
      </a>
    </Link>
  )
}
