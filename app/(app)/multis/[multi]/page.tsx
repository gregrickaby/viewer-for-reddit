import type { Metadata, Route } from 'next'
import Link from 'next/link'
import { Suspense, useId, ViewTransition } from 'react'

import styles from '@/app/(app)/feed-page.module.css'
import multis from '@/app/(app)/multis/multis.module.css'
import { addToMultiForm, deleteMultiForm, updateMultiForm } from '@/app/actions/multis'
import { ActionForm } from '@/components/islands/action-form'
import { MembershipToggle } from '@/components/islands/membership-toggle'
import { PendingButton } from '@/components/islands/pending-button'
import { SectionError } from '@/components/islands/section-error'
import { PageTransition, Reveal, SkeletonExit } from '@/components/motion/transitions'
import { Button } from '@/components/ui/button'
import { getMulti } from '@/lib/reddit/multis'
import { handleReadError } from '@/lib/reddit/read-errors'
import { getMySubscriptions } from '@/lib/reddit/reads'
import type { MultiView, SubredditView } from '@/lib/view-models'

type Props = PageProps<'/multis/[multi]'>

/** How many subscribed communities to suggest. */
const SUGGESTIONS = 20
const LIST_ENTER = { 'list-change': 'fade-in', default: 'none' }
const LIST_EXIT = { 'list-change': 'fade-out', default: 'none' }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { multi } = await params
  return { title: `Edit m/${multi}` }
}

async function Editor({ params }: Pick<Props, 'params'>) {
  const { multi: name } = await params
  let multi: MultiView
  try {
    multi = await getMulti(name)
  } catch (error) {
    handleReadError(error)
    return (
      <div className={multis.panel}>
        <p>Reddit won&apos;t let you edit this multireddit.</p>
      </div>
    )
  }
  const subscriptions = await getMySubscriptions().catch((): SubredditView[] => [])
  const members = new Set(multi.subreddits.map((subreddit) => subreddit.toLowerCase()))
  const suggestions = subscriptions
    .filter((entry) => entry.kind === 'community' && !members.has(entry.name.toLowerCase()))
    .slice(0, SUGGESTIONS)

  return (
    <>
      <nav aria-label="Breadcrumb" className={multis.meta}>
        <Link href={'/multis' as Route} transitionTypes={['nav-back']}>
          ← Multireddits
        </Link>
        {' · '}
        <Link href={multi.href as Route} transitionTypes={['nav-forward']}>
          View feed →
        </Link>
      </nav>
      <h1 className={styles.title}>{multi.displayName}</h1>

      <section aria-labelledby="details" className={multis.panel}>
        <h2 className={multis.heading} id="details">
          Details
        </h2>
        <ActionForm action={updateMultiForm} className={multis.form} success="Saved.">
          <input name="name" type="hidden" value={multi.name} />
          <label className={multis.field}>
            <span>Name</span>
            <input
              className={multis.input}
              defaultValue={multi.displayName}
              maxLength={50}
              name="displayName"
              required
            />
          </label>
          <label className={multis.field}>
            <span>Description</span>
            <textarea
              className={multis.input}
              defaultValue={multi.descriptionMd}
              maxLength={500}
              name="description"
              rows={3}
            />
          </label>
          <fieldset className={multis.choices}>
            <legend>Who can see it</legend>
            {(['private', 'public', 'hidden'] as const).map((value) => (
              <label key={value}>
                <input
                  defaultChecked={multi.visibility === value}
                  name="visibility"
                  type="radio"
                  value={value}
                />
                {value === 'private'
                  ? 'Only me'
                  : value === 'public'
                    ? 'Anyone'
                    : 'Anyone with the link'}
              </label>
            ))}
          </fieldset>
          <div>
            <PendingButton>Save</PendingButton>
          </div>
        </ActionForm>
      </section>

      <section aria-labelledby="communities" className={multis.panel}>
        <h2 className={multis.heading} id="communities">
          Communities ({multi.subreddits.length})
        </h2>
        <ActionForm action={addToMultiForm} className={multis.inline}>
          <input name="multi" type="hidden" value={multi.name} />
          <label className={multis.field}>
            <span>Add a community</span>
            <input
              className={multis.input}
              maxLength={24}
              name="subreddit"
              placeholder="r/…"
              required
            />
          </label>
          <PendingButton>Add</PendingButton>
        </ActionForm>
        {multi.subreddits.length > 0 ? (
          <ul className={multis.list} role="list">
            {multi.subreddits.map((subreddit) => (
              <ViewTransition
                default="none"
                enter={LIST_ENTER}
                exit={LIST_EXIT}
                key={subreddit.toLowerCase()}
              >
                <li className={multis.row}>
                  <Link
                    className={multis.name}
                    href={`/r/${subreddit}` as Route}
                    transitionTypes={['nav-forward']}
                  >
                    r/{subreddit}
                  </Link>
                  <MembershipToggle
                    label={multi.displayName}
                    member
                    multi={multi.name}
                    subreddit={subreddit}
                    variant="button"
                  />
                </li>
              </ViewTransition>
            ))}
          </ul>
        ) : (
          <p className={multis.help}>
            No communities yet. Add one above or pick from your subscriptions below.
          </p>
        )}
      </section>

      {suggestions.length > 0 ? (
        <section aria-labelledby="suggestions" className={multis.panel}>
          <h2 className={multis.heading} id="suggestions">
            From your subscriptions
          </h2>
          <ul className={multis.list} role="list">
            {suggestions.map((entry) => (
              <ViewTransition
                default="none"
                enter={LIST_ENTER}
                exit={LIST_EXIT}
                key={entry.fullname}
              >
                <li className={multis.row}>
                  <span className={multis.name}>r/{entry.name}</span>
                  <MembershipToggle
                    label={multi.displayName}
                    member={false}
                    multi={multi.name}
                    subreddit={entry.name}
                    variant="button"
                  />
                </li>
              </ViewTransition>
            ))}
          </ul>
        </section>
      ) : null}

      <DangerZone multi={multi} />
    </>
  )
}

/** Deleting asks first, in a native popover; it works without JavaScript. */
function DangerZone({ multi }: { multi: MultiView }) {
  const id = useId()
  return (
    <section aria-labelledby="danger" className={`${multis.panel} ${multis.danger}`}>
      <h2 className={multis.heading} id="danger">
        Delete
      </h2>
      <p className={multis.help}>Deleting removes the multireddit, not the communities in it.</p>
      <div>
        <Button popoverTarget={id} size="sm" variant="secondary">
          Delete {multi.displayName}…
        </Button>
      </div>
      <div
        aria-label={`Delete ${multi.displayName}`}
        className={multis.confirm}
        id={id}
        popover="auto"
        role="dialog"
      >
        <p>Delete {multi.displayName}? This can&apos;t be undone.</p>
        <div className={multis.confirmActions}>
          <Button popoverTarget={id} popoverTargetAction="hide" size="sm" variant="secondary">
            Cancel
          </Button>
          <ActionForm action={deleteMultiForm}>
            <input name="name" type="hidden" value={multi.name} />
            <PendingButton variant="danger">Delete</PendingButton>
          </ActionForm>
        </div>
      </div>
    </section>
  )
}

export default function EditMultiPage({ params }: Props) {
  return (
    <PageTransition>
      <div className={styles.page}>
        <SectionError title="Couldn't load this multireddit">
          <Suspense
            fallback={
              <SkeletonExit>
                <span aria-busy="true" className={`skeleton ${multis.skeleton}`} />
              </SkeletonExit>
            }
          >
            <Reveal>
              <div className={styles.page}>
                <Editor params={params} />
              </div>
            </Reveal>
          </Suspense>
        </SectionError>
      </div>
    </PageTransition>
  )
}
