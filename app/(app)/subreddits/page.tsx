import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SectionError } from '@/components/islands/section-error'
import { PageTransition, Reveal, SkeletonExit } from '@/components/motion/transitions'
import { SubredditRows, SubredditRowsSkeleton } from '@/components/subreddit/subreddit-row'
import { Tabs } from '@/components/ui/tabs'
import { getMySubscriptions } from '@/lib/reddit/reads'
import { SUBSCRIPTION_TABS, type SubscriptionTab, href, parseText, pick } from '@/lib/url-state'
import feed from '@/components/feed/feed.module.css'
import styles from '../feed-page.module.css'
import page from './page.module.css'

export const metadata: Metadata = { title: 'Subscriptions' }

const LABELS: Record<SubscriptionTab, string> = { communities: 'Communities', people: 'People' }

async function Subscriptions({ searchParams }: Pick<PageProps<'/subreddits'>, 'searchParams'>) {
  const params = await searchParams
  const tab = pick(SUBSCRIPTION_TABS, params.tab)
  const q = parseText(params.q, 50)
  const all = await getMySubscriptions()

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
    <section className={feed.feed} aria-label={LABELS[tab]}>
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
        {/* A plain GET form: filtering is URL state, applied on the server (design §4.1). */}
        <form action="/subreddits" method="get" role="search" className={page.filter}>
          {tab === 'people' ? <input type="hidden" name="tab" value="people" /> : null}
          <label htmlFor="subscription-filter" className="visually-hidden">
            Filter {LABELS[tab].toLowerCase()}
          </label>
          <input
            id="subscription-filter"
            name="q"
            type="search"
            defaultValue={q}
            placeholder={`Filter ${LABELS[tab].toLowerCase()}…`}
            className={page.input}
          />
        </form>
      </div>
      <div className={feed.list}>
        {items.length > 0 ? (
          <SubredditRows items={items} confirmLeave />
        ) : (
          <div className={feed.notice}>
            <p className={feed.noticeTitle}>
              {q ? `No matches for “${q}”` : `No ${LABELS[tab].toLowerCase()} yet`}
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
        <h1 className={styles.title}>Subscriptions</h1>
        <SectionError title="Couldn’t load your subscriptions">
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
