import type { Metadata } from 'next'
import { Suspense } from 'react'

import { FeedSkeleton } from '@/components/feed/feed-section'
import feed from '@/components/feed/feed.module.css'
import { ForbiddenPanel } from '@/components/feed/forbidden-panel'
import { firstFullname, ItemList } from '@/components/feed/item-list'
import { Pagination } from '@/components/feed/pagination'
import { InfiniteFeed } from '@/components/islands/infinite-feed'
import { SectionError } from '@/components/islands/section-error'
import {
  ContentReveal,
  PageTransition,
  Reveal,
  SkeletonExit,
} from '@/components/motion/transitions'
import { BackLink } from '@/components/ui/back-link'
import { Tabs } from '@/components/ui/tabs'
import { getSaved } from '@/lib/reddit/people'
import { handleReadError } from '@/lib/reddit/read-errors'
import { requestTime } from '@/lib/request-time'
import { getSettings } from '@/lib/settings'
import {
  href,
  PAGE_SIZE,
  pageOffset,
  parseFeedQuery,
  pick,
  SAVED_TYPES,
  type SavedType,
} from '@/lib/url-state'
import type { ListItem, Page } from '@/lib/view-models'

import styles from '../feed-page.module.css'

export const metadata: Metadata = { title: 'Saved' }

const LABELS: Record<SavedType, string> = { all: 'All', links: 'Posts', comments: 'Comments' }
/** Saved items have no sort; this only fills `FeedQuery`. */
const SORTS = ['new'] as const

async function SavedSection({ searchParams }: Pick<PageProps<'/saved'>, 'searchParams'>) {
  const params = await searchParams
  const type = pick(SAVED_TYPES, params.type)
  const query = parseFeedQuery(params, SORTS)

  let page: Page<ListItem>
  try {
    page = await getSaved(type, query)
  } catch (error) {
    return <ForbiddenPanel reason={handleReadError(error)} />
  }
  const [{ blurNsfw }, now] = await Promise.all([getSettings(), requestTime()])
  const extra = { type: type === 'all' ? null : type }

  return (
    <section className={feed.feed} aria-label="Saved items">
      <Tabs
        label="Saved item types"
        tabs={SAVED_TYPES.map((value) => ({
          href: href('/saved', { type: value === 'all' ? null : value }),
          label: LABELS[value],
          current: value === type,
        }))}
      />
      <ContentReveal
        name="saved-content"
        contentKey={`${type}:${query.after ?? query.before ?? 'first'}`}
      >
        <div className={feed.list}>
          <ItemList
            items={page.items}
            now={now}
            blurNsfw={blurNsfw}
            empty={{
              title: 'Nothing saved yet',
              detail: 'Save posts and comments to find them here.',
            }}
          />
        </div>
      </ContentReveal>
      {page.after ? (
        <InfiniteFeed
          key={`${type}:${query.after ?? query.before ?? 'first'}:${blurNsfw}`}
          base="/saved"
          defaultSort="new"
          extra={extra}
          request={{
            source: { type: 'saved', filter: type },
            sort: query.sort,
            t: query.t,
            after: page.after,
            count: pageOffset(query) + PAGE_SIZE,
            showSubreddit: true,
          }}
        />
      ) : null}
      <Pagination
        infinite
        base="/saved"
        query={query}
        after={page.after}
        firstFullname={firstFullname(page.items)}
        defaultSort="new"
        extra={extra}
      />
    </section>
  )
}

export default function SavedPage({ searchParams }: PageProps<'/saved'>) {
  return (
    <PageTransition>
      <div className={styles.page}>
        <BackLink href="/home">Home</BackLink>
        <h1 className={styles.title}>Saved</h1>
        <SectionError title="Couldn’t load your saved items">
          <Suspense
            fallback={
              <SkeletonExit>
                <FeedSkeleton />
              </SkeletonExit>
            }
          >
            <Reveal>
              <SavedSection searchParams={searchParams} />
            </Reveal>
          </Suspense>
        </SectionError>
      </div>
    </PageTransition>
  )
}
