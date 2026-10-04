'use client'

import { type ReactNode, useState } from 'react'
import { CommentComposer, type CommentComposerProps } from './comment-composer'

/**
 * A comment's Reply or Edit `<details>` (design §8.6). A thread can show hundreds of
 * comments, so the composer island mounts only once its details first opens. Until
 * then the details holds `fallback`, the same form rendered on the server, which also
 * posts without JavaScript.
 */
export function ComposerDetails({
  summary,
  className,
  summaryClassName,
  composer,
  fallback,
}: {
  summary: string
  className?: string
  summaryClassName?: string
  composer: CommentComposerProps
  fallback: ReactNode
}) {
  const [opened, setOpened] = useState(false)
  return (
    <details
      className={className}
      onToggle={(event) => {
        if (event.currentTarget.open) setOpened(true)
      }}
    >
      <summary className={summaryClassName}>{summary}</summary>
      {opened ? <CommentComposer {...composer} /> : fallback}
    </details>
  )
}
