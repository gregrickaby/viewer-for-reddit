import type { Metadata, Route } from 'next'
import Link from 'next/link'
import { Suspense, ViewTransition, useId } from 'react'
import { addToMultiForm, deleteMultiForm, updateMultiForm } from '@/app/actions/multis'
import { ActionForm } from '@/components/islands/action-form'
import { MembershipToggle } from '@/components/islands/membership-toggle'
import { PendingButton } from '@/components/islands/pending-button'
import { Button } from '@/components/ui/button'
import { SectionError } from '@/components/islands/section-error'
import { PageTransition, Reveal, SkeletonExit } from '@/components/motion/transitions'
import { getMulti } from '@/lib/reddit/multis'
import { handleReadError } from '@/lib/reddit/read-errors'
import { getMySubscriptions } from '@/lib/reddit/reads'
import type { MultiView, SubredditView } from '@/lib/view-models'
import styles from '../../feed-page.module.css'
import multis from '../multis.module.css'

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
        <p>Reddit won’t let you edit this multireddit.</p>
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

      <section className={multis.panel} aria-labelledby="details">
        <h2 id="details" className={multis.heading}>
          Details
        </h2>
        <ActionForm action={updateMultiForm} className={multis.form} success="Saved.">
          <input type="hidden" name="name" value={multi.name} />
          <label className={multis.field}>
            <span>Name</span>
            <input
              name="displayName"
              required
              maxLength={50}
              defaultValue={multi.displayName}
              className={multis.input}
            />
          </label>
          <label className={multis.field}>
            <span>Description</span>
            <textarea
              name="description"
              maxLength={500}
              rows={3}
              defaultValue={multi.descriptionMd}
              className={multis.input}
            />
          </label>
          <fieldset className={multis.choices}>
            <legend>Who can see it</legend>
            {(['private', 'public', 'hidden'] as const).map((value) => (
              <label key={value}>
                <input
                  type="radio"
                  name="visibility"
                  value={value}
                  defaultChecked={multi.visibility === value}
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

      <section className={multis.panel} aria-labelledby="communities">
        <h2 id="communities" className={multis.heading}>
          Communities ({multi.subreddits.length})
        </h2>
        <ActionForm action={addToMultiForm} className={multis.inline}>
          <input type="hidden" name="multi" value={multi.name} />
          <label className={multis.field}>
            <span>Add a community</span>
            <input
              name="subreddit"
              required
              placeholder="r/…"
              maxLength={24}
              className={multis.input}
            />
          </label>
          <PendingButton>Add</PendingButton>
        </ActionForm>
        {multi.subreddits.length > 0 ? (
          <ul role="list" className={multis.list}>
            {multi.subreddits.map((subreddit) => (
              <ViewTransition
                key={subreddit.toLowerCase()}
                enter={LIST_ENTER}
                exit={LIST_EXIT}
                default="none"
              >
                <li className={multis.row}>
                  <Link
                    href={`/r/${subreddit}` as Route}
                    className={multis.name}
                    transitionTypes={['nav-forward']}
                  >
                    r/{subreddit}
                  </Link>
                  <MembershipToggle
                    multi={multi.name}
                    subreddit={subreddit}
                    member
                    label={multi.displayName}
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
        <section className={multis.panel} aria-labelledby="suggestions">
          <h2 id="suggestions" className={multis.heading}>
            From your subscriptions
          </h2>
          <ul role="list" className={multis.list}>
            {suggestions.map((entry) => (
              <ViewTransition
                key={entry.fullname}
                enter={LIST_ENTER}
                exit={LIST_EXIT}
                default="none"
              >
                <li className={multis.row}>
                  <span className={multis.name}>r/{entry.name}</span>
                  <MembershipToggle
                    multi={multi.name}
                    subreddit={entry.name}
                    member={false}
                    label={multi.displayName}
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
    <section className={`${multis.panel} ${multis.danger}`} aria-labelledby="danger">
      <h2 id="danger" className={multis.heading}>
        Delete
      </h2>
      <p className={multis.help}>Deleting removes the multireddit, not the communities in it.</p>
      <div>
        <Button variant="secondary" size="sm" popoverTarget={id}>
          Delete {multi.displayName}…
        </Button>
      </div>
      <div
        id={id}
        popover="auto"
        className={multis.confirm}
        role="dialog"
        aria-label={`Delete ${multi.displayName}`}
      >
        <p>Delete {multi.displayName}? This can’t be undone.</p>
        <div className={multis.confirmActions}>
          <Button variant="secondary" size="sm" popoverTarget={id} popoverTargetAction="hide">
            Cancel
          </Button>
          <ActionForm action={deleteMultiForm}>
            <input type="hidden" name="name" value={multi.name} />
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
        <SectionError title="Couldn’t load this multireddit">
          <Suspense
            fallback={
              <SkeletonExit>
                <span className={`skeleton ${multis.skeleton}`} aria-busy="true" />
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
