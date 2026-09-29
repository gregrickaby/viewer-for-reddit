import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Pagination } from '@/components/feed/pagination'
import { SectionError } from '@/components/islands/section-error'
import {
  ContentReveal,
  PageTransition,
  Reveal,
  SkeletonExit,
} from '@/components/motion/transitions'
import { SubredditRows, SubredditRowsSkeleton } from '@/components/subreddit/subreddit-row'
import { searchSubreddits } from '@/lib/reddit/people'
import { parseFeedQuery, parseText } from '@/lib/url-state'
import feed from '@/components/feed/feed.module.css'
import styles from '../feed-page.module.css'
import page from '../subreddits/page.module.css'

export const metadata: Metadata = { title: 'Search' }

const SORTS = ['new'] as const

async function Results({ searchParams }: Pick<PageProps<'/search'>, 'searchParams'>) {
  const params = await searchParams
  const q = parseText(params.q)
  if (!q) {
    return (
      <div className={feed.notice}>
        <p className={feed.noticeTitle}>Find communities</p>
        <p>Search by name or topic, like “typescript” or “houseplants”.</p>
      </div>
    )
  }

  const query = parseFeedQuery(params, SORTS)
  const results = await searchSubreddits(q, query)
  return (
    <section className={feed.feed} aria-label={`Communities matching ${q}`}>
      <ContentReveal
        name="search-results"
        contentKey={`${q}:${query.after ?? query.before ?? 'first'}`}
      >
        <div className={feed.list}>
          {results.items.length > 0 ? (
            <SubredditRows items={results.items} showDescription />
          ) : (
            <div className={feed.notice}>
              <p className={feed.noticeTitle}>No communities match “{q}”</p>
              <p>Try a shorter or different word.</p>
            </div>
          )}
        </div>
      </ContentReveal>
      <Pagination
        base="/search"
        query={query}
        after={results.after}
        firstFullname={results.items[0]?.fullname}
        defaultSort="new"
        extra={{ q }}
      />
    </section>
  )
}

/** The query text, prefilled into the form; request data, so it streams. */
async function SearchForm({ searchParams }: Pick<PageProps<'/search'>, 'searchParams'>) {
  const q = parseText((await searchParams).q)
  return <SearchFormFields defaultValue={q} />
}

function SearchFormFields({ defaultValue }: { defaultValue: string }) {
  return (
    <form action="/search" method="get" role="search" className={page.filter}>
      <label htmlFor="search-page-q" className="visually-hidden">
        Search communities
      </label>
      <input
        id="search-page-q"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Search communities…"
        className={page.input}
        enterKeyHint="search"
      />
    </form>
  )
}

export default function SearchPage({ searchParams }: PageProps<'/search'>) {
  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={page.toolbar}>
          <h1 className={styles.title}>Search</h1>
          <Suspense fallback={<SearchFormFields defaultValue="" />}>
            <SearchForm searchParams={searchParams} />
          </Suspense>
        </div>
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
