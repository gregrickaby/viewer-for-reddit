import type { Metadata, Route } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import styles from '@/app/(app)/feed-page.module.css'
import { createMultiForm } from '@/app/actions/multis'
import feed from '@/components/feed/feed.module.css'
import { ForbiddenPanel } from '@/components/feed/forbidden-panel'
import { ActionForm } from '@/components/islands/action-form'
import { PendingButton } from '@/components/islands/pending-button'
import { SectionError } from '@/components/islands/section-error'
import { PageTransition, Reveal, SkeletonExit } from '@/components/motion/transitions'
import { SubredditRowsSkeleton } from '@/components/subreddit/subreddit-row'
import { BackLink } from '@/components/ui/back-link'
import { handleReadError } from '@/lib/reddit/read-errors'
import { getMyMultis } from '@/lib/reddit/reads'
import type { MultiView } from '@/lib/view-models'

import multis from './multis.module.css'

export const metadata: Metadata = { title: 'Multireddits' }

const VISIBILITY: Record<string, string> = {
  private: 'Private',
  public: 'Public',
  hidden: 'Hidden',
}

async function MultiList() {
  let all: MultiView[]
  try {
    all = await getMyMultis()
  } catch (error) {
    return <ForbiddenPanel reason={handleReadError(error)} />
  }
  if (all.length === 0) {
    return (
      <div className={feed.notice}>
        <p className={feed.noticeTitle}>No multireddits yet</p>
        <p>A multireddit combines several communities into one feed. Create one below.</p>
      </div>
    )
  }
  return (
    <ul className={multis.list} role="list">
      {all.map((multi) => (
        <li className={multis.row} key={multi.name}>
          <div className={multis.text}>
            <Link
              className={multis.name}
              href={multi.href as Route}
              transitionTypes={['nav-forward']}
            >
              {multi.displayName}
            </Link>
            <p className={multis.meta}>
              {multi.subreddits.length}{' '}
              {multi.subreddits.length === 1 ? 'community' : 'communities'} ·{' '}
              {VISIBILITY[multi.visibility]}
            </p>
          </div>
          {multi.canEdit ? (
            <Link
              className={multis.edit}
              href={`/multis/${multi.name}` as Route}
              transitionTypes={['nav-forward']}
            >
              Edit
            </Link>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

export default function MultisPage() {
  return (
    <PageTransition>
      <div className={styles.page}>
        <BackLink href="/home">Home</BackLink>
        <h1 className={styles.title}>Multireddits</h1>
        <SectionError title="Couldn't load your multireddits">
          <Suspense
            fallback={
              <SkeletonExit>
                <SubredditRowsSkeleton />
              </SkeletonExit>
            }
          >
            <Reveal>
              <MultiList />
            </Reveal>
          </Suspense>
        </SectionError>

        <section aria-labelledby="new-multi" className={multis.panel}>
          <h2 className={multis.heading} id="new-multi">
            New multireddit
          </h2>
          <ActionForm action={createMultiForm} className={multis.form}>
            <label className={multis.field}>
              <span>Name</span>
              <input className={multis.input} maxLength={50} name="displayName" required />
            </label>
            <label className={multis.field}>
              <span>Description (optional)</span>
              <textarea className={multis.input} maxLength={500} name="description" rows={2} />
            </label>
            <div>
              <PendingButton>Create</PendingButton>
            </div>
          </ActionForm>
        </section>
      </div>
    </PageTransition>
  )
}
