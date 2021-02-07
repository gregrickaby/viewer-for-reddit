import Link from 'next/link'

export default function BackToTop() {
  return (
    <Link href="/">
      <a
        aria-label="go back to top"
        className="fixed bottom-0 right-0 mr-10 mb-12 py-2 px-4 rounded-lg bg-black hover:no-underline"
      >
        <span className="text-white">&uarr;</span>
      </a>
    </Link>
  )
}
