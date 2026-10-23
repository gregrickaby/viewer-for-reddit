import Link from 'next/link'

import type { FaqLink } from '@/lib/site'

/** One FAQ answer: text, with links to this site or out to a service's documentation. */
export function FaqAnswer({ parts }: { parts: ReadonlyArray<string | FaqLink> }) {
  return parts.map((part, index) => {
    if (typeof part === 'string') return part
    return part.page ? (
      <Link href={part.page} key={index}>
        {part.text}
      </Link>
    ) : (
      <a href={part.href} key={index} rel="noopener noreferrer" target="_blank">
        {part.text}
      </a>
    )
  })
}
