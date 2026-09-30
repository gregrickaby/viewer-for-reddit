import type { Metadata, Route } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { createMultiForm } from '@/app/actions/multis'
import { ForbiddenPanel } from '@/components/feed/forbidden-panel'
import { ActionForm } from '@/components/islands/action-form'
import { PendingButton } from '@/components/islands/pending-button'
import { SectionError } from '@/components/islands/section-error'
import { PageTransition, Reveal, SkeletonExit } from '@/components/motion/transitions'
import { SubredditRowsSkeleton } from '@/components/subreddit/subreddit-row'
import { handleReadError } from '@/lib/reddit/read-errors'
import { getMyMultis } from '@/lib/reddit/reads'
import type { MultiView } from '@/lib/view-models'
import feed from '@/components/feed/feed.module.css'
import styles from '../feed-page.module.css'
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
    <ul role="list" className={multis.list}>
      {all.map((multi) => (
        <li key={multi.name} className={multis.row}>
          <div className={multis.text}>
            <Link
              href={multi.href as Route}
              className={multis.name}
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
              href={`/multis/${multi.name}` as Route}
              className={multis.edit}
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
        <h1 className={styles.title}>Multireddits</h1>
        <SectionError title="Couldn’t load your multireddits">
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

        <section className={multis.panel} aria-labelledby="new-multi">
          <h2 id="new-multi" className={multis.heading}>
            New multireddit
          </h2>
          <ActionForm action={createMultiForm} className={multis.form}>
            <label className={multis.field}>
              <span>Name</span>
              <input name="displayName" required maxLength={50} className={multis.input} />
            </label>
            <label className={multis.field}>
              <span>Description (optional)</span>
              <textarea name="description" maxLength={500} rows={2} className={multis.input} />
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
