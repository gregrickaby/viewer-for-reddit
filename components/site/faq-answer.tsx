import Link from 'next/link'
import type { FaqLink } from '@/lib/site'

/** One FAQ answer: text, with links to this site or out to a service's documentation. */
export function FaqAnswer({ parts }: { parts: ReadonlyArray<string | FaqLink> }) {
  return parts.map((part, index) => {
    if (typeof part === 'string') return part
    return part.page ? (
      <Link key={index} href={part.page}>
        {part.text}
      </Link>
    ) : (
      <a key={index} href={part.href} target="_blank" rel="noopener noreferrer">
        {part.text}
      </a>
    )
  })
}
