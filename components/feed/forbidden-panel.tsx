import type { ForbiddenReason } from '@/lib/reddit/errors'
import styles from './feed.module.css'

const COPY: Record<ForbiddenReason, { title: string; detail: string }> = {
  private: {
    title: 'This community is private',
    detail: 'Only approved members can see its posts.',
  },
  quarantined: {
    title: 'This community is quarantined',
    detail: 'Reddit requires opting in on reddit.com before its posts can be shown.',
  },
  banned: {
    title: 'This community was banned',
    detail: 'Reddit has banned it, so there’s nothing to show.',
  },
  gold_only: {
    title: 'This community is for Reddit Premium members',
    detail: 'Reddit only shows it to Premium accounts.',
  },
  unknown: {
    title: 'Reddit won’t show this',
    detail: 'Reddit refused access to this page.',
  },
}

/** An inline page state for a 403 from Reddit (design §12). */
export function ForbiddenPanel({ reason }: { reason: ForbiddenReason }) {
  const { title, detail } = COPY[reason]
  return (
    <div className={styles.notice}>
      <p className={styles.noticeTitle}>{title}</p>
      <p>{detail}</p>
    </div>
  )
}
