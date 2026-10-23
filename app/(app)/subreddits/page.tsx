import type { Metadata } from 'next'
import { Suspense } from 'react'

import styles from '@/app/(app)/feed-page.module.css'
import feed from '@/components/feed/feed.module.css'
import { ForbiddenPanel } from '@/components/feed/forbidden-panel'
import { SectionError } from '@/components/islands/section-error'
import { PageTransition, Reveal, SkeletonExit } from '@/components/motion/transitions'
import { SubredditRows, SubredditRowsSkeleton } from '@/components/subreddit/subreddit-row'
import { BackLink } from '@/components/ui/back-link'
import { Tabs } from '@/components/ui/tabs'
import { handleReadError } from '@/lib/reddit/read-errors'
import { getMySubscriptions } from '@/lib/reddit/reads'
import { href, parseText, pick, SUBSCRIPTION_TABS, type SubscriptionTab } from '@/lib/url-state'
import type { SubredditView } from '@/lib/view-models'

import page from './page.module.css'

export const metadata: Metadata = { title: 'Subscriptions' }

const LABELS: Record<SubscriptionTab, string> = { communities: 'Communities', people: 'People' }

async function Subscriptions({ searchParams }: Pick<PageProps<'/subreddits'>, 'searchParams'>) {
  const params = await searchParams
  const tab = pick(SUBSCRIPTION_TABS, params.tab)
  const q = parseText(params.q, 50)
  let all: SubredditView[]
  try {
    all = await getMySubscriptions()
  } catch (error) {
    return <ForbiddenPanel reason={handleReadError(error)} />
  }

  const kind = tab === 'people' ? 'user' : 'community'
  const needle = q.toLowerCase()
  const items = all.filter(
    (item) =>
      item.kind === kind &&
      (!needle ||
        item.name.toLowerCase().includes(needle) ||
        item.title.toLowerCase().includes(needle)),
  )
  const counts = {
    communities: all.filter((item) => item.kind === 'community').length,
    people: all.filter((item) => item.kind === 'user').length,
  }

  return (
    <section aria-label={LABELS[tab]} className={feed.feed}>
      <div className={page.toolbar}>
        <Tabs
          label="Subscription types"
          tabs={SUBSCRIPTION_TABS.map((value) => ({
            href: href('/subreddits', {
              tab: value === 'communities' ? null : value,
              q: q || null,
            }),
            label: `${LABELS[value]} (${counts[value]})`,
            current: value === tab,
          }))}
        />
        {/* A plain GET form: filtering is URL state, applied on the server. */}
        <form action="/subreddits" className={page.filter} method="get" role="search">
          {tab === 'people' ? <input name="tab" type="hidden" value="people" /> : null}
          <label className="visually-hidden" htmlFor="subscription-filter">
            Filter {LABELS[tab].toLowerCase()}
          </label>
          <input
            className={page.input}
            defaultValue={q}
            id="subscription-filter"
            name="q"
            placeholder={`Filter ${LABELS[tab].toLowerCase()}…`}
            type="search"
          />
        </form>
      </div>
      <div className={feed.list}>
        {items.length > 0 ? (
          <SubredditRows confirmLeave items={items} />
        ) : (
          <div className={feed.notice}>
            <p className={feed.noticeTitle}>
              {q ? `No matches for "${q}"` : `No ${LABELS[tab].toLowerCase()} yet`}
            </p>
            <p>
              {tab === 'people'
                ? 'Follow people from their profiles.'
                : 'Search for communities to join.'}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default function SubscriptionsPage({ searchParams }: PageProps<'/subreddits'>) {
  return (
    <PageTransition>
      <div className={styles.page}>
        <BackLink href="/home">Home</BackLink>
        <h1 className={styles.title}>Subscriptions</h1>
        <SectionError title="Couldn't load your subscriptions">
          <Suspense
            fallback={
              <SkeletonExit>
                <SubredditRowsSkeleton />
              </SkeletonExit>
            }
          >
            <Reveal>
              <Subscriptions searchParams={searchParams} />
            </Reveal>
          </Suspense>
        </SectionError>
      </div>
    </PageTransition>
  )
}
