import Link from 'next/link'

export default function BackToTop() {
  return (
    <Link href="/">
      <a className="back-to-top">&uarr;</a>
    </Link>
  )
}
