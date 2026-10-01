import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ForbiddenPanel } from '@/components/feed/forbidden-panel'
import { ItemList, firstFullname } from '@/components/feed/item-list'
import { Pagination } from '@/components/feed/pagination'
import { SectionError } from '@/components/islands/section-error'
import {
  ContentReveal,
  PageTransition,
  Reveal,
  SkeletonExit,
} from '@/components/motion/transitions'
import { SubredditRows, SubredditRowsSkeleton } from '@/components/subreddit/subreddit-row'
import { Tabs } from '@/components/ui/tabs'
import { BackLink } from '@/components/ui/back-link'
import { searchPeople, searchPosts, searchSubreddits } from '@/lib/reddit/people'
import { handleReadError } from '@/lib/reddit/read-errors'
import { getMyMultis } from '@/lib/reddit/reads'
import { requestTime } from '@/lib/request-time'
import { getSettings } from '@/lib/settings'
import {
  type FeedQuery,
  SEARCH_TABS,
  type SearchTab,
  href,
  parseFeedQuery,
  parseText,
  pick,
} from '@/lib/url-state'
import type { ListItem, MultiView, Page, SubredditView } from '@/lib/view-models'
import feed from '@/components/feed/feed.module.css'
import styles from '../feed-page.module.css'

export const metadata: Metadata = { title: 'Search' }

const SORTS = ['new'] as const

const LABELS: Record<SearchTab, string> = {
  communities: 'Communities',
  people: 'People',
  posts: 'Posts',
}

type Found =
  | { tab: 'communities' | 'people'; page: Page<SubredditView>; multis?: MultiView[] }
  | { tab: 'posts'; page: Page<ListItem> }

async function search(q: string, tab: SearchTab, query: FeedQuery): Promise<Found> {
  if (tab === 'people') return { tab, page: await searchPeople(q, query) }
  if (tab === 'posts') return { tab, page: await searchPosts(q, query) }
  const [results, multis] = await Promise.all([
    searchSubreddits(q, query),
    getMyMultis().catch(() => undefined),
  ])
  return { tab, page: results, multis }
}

async function Results({ searchParams }: Pick<PageProps<'/search'>, 'searchParams'>) {
  const params = await searchParams
  const q = parseText(params.q)
  if (!q) {
    return (
      <div className={feed.notice}>
        <p className={feed.noticeTitle}>Find communities, people, and posts</p>
        <p>Search by name or topic, like “typescript” or “houseplants”.</p>
      </div>
    )
  }

  const tab = pick(SEARCH_TABS, params.tab)
  const query = parseFeedQuery(params, SORTS)
  let found: Found
  try {
    found = await search(q, tab, query)
  } catch (error) {
    return <ForbiddenPanel reason={handleReadError(error)} />
  }
  const [{ blurNsfw }, now] =
    found.tab === 'posts'
      ? await Promise.all([getSettings(), requestTime()])
      : [{ blurNsfw: false }, 0]
  const { items } = found.page
  const first =
    found.tab === 'posts' ? firstFullname(found.page.items) : found.page.items[0]?.fullname

  return (
    <section className={feed.feed} aria-label={`${LABELS[tab]} matching ${q}`}>
      <Tabs
        label="Search types"
        tabs={SEARCH_TABS.map((value) => ({
          href: href('/search', { q, tab: value === 'communities' ? null : value }),
          label: LABELS[value],
          current: value === tab,
        }))}
      />
      <ContentReveal
        name="search-results"
        contentKey={`${q}:${tab}:${query.after ?? query.before ?? 'first'}`}
      >
        <div className={feed.list}>
          {found.tab === 'posts' ? (
            <ItemList
              items={found.page.items}
              now={now}
              blurNsfw={blurNsfw}
              empty={{
                title: `No posts match “${q}”`,
                detail: 'Try a shorter or different word.',
              }}
            />
          ) : items.length > 0 ? (
            <SubredditRows
              items={found.page.items}
              showDescription
              multis={found.tab === 'communities' ? found.multis : undefined}
            />
          ) : (
            <div className={feed.notice}>
              <p className={feed.noticeTitle}>{`No ${LABELS[tab].toLowerCase()} match “${q}”`}</p>
              <p>Try a shorter or different word.</p>
            </div>
          )}
        </div>
      </ContentReveal>
      <Pagination
        base="/search"
        query={query}
        after={found.page.after}
        firstFullname={first}
        defaultSort="new"
        extra={{ q, tab: tab === 'communities' ? null : tab }}
      />
    </section>
  )
}

export default function SearchPage({ searchParams }: PageProps<'/search'>) {
  return (
    <PageTransition>
      <div className={styles.page}>
        <BackLink href="/home">Home</BackLink>
        <h1 className={styles.title}>Search</h1>
        <SectionError title="Couldn’t search Reddit">
          <Suspense
            fallback={
              <SkeletonExit>
                <SubredditRowsSkeleton />
              </SkeletonExit>
            }
          >
            <Reveal>
              <Results searchParams={searchParams} />
            </Reveal>
          </Suspense>
        </SectionError>
      </div>
    </PageTransition>
  )
}
