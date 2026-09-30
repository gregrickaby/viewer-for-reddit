import type { Route } from 'next'
import Link from 'next/link'
import { LiveTime } from '@/components/islands/live-time'
import { RedditHtml } from '@/components/reddit-html'
import type { LiveUpdateView } from '@/lib/view-models'
import styles from './live.module.css'

/** The list items of a run of updates. The caller owns the `<ol>`, so pages can be appended. */
export function LiveUpdateItems({ updates, now }: { updates: LiveUpdateView[]; now: number }) {
  return updates.map((update) => (
    <li key={update.name} className={styles.update} data-stricken={update.stricken || undefined}>
      <p className={styles.meta}>
        <LiveTime utc={update.createdUtc} now={now} />
        {update.author ? (
          <Link href={`/user/${update.author}` as Route} transitionTypes={['nav-forward']}>
            u/{update.author}
          </Link>
        ) : null}
        {update.stricken ? <span>Struck</span> : null}
      </p>
      {update.body ? <RedditHtml html={update.body} /> : null}
    </li>
  ))
}
