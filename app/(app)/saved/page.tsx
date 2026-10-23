import type { Metadata } from 'next'
import { Suspense } from 'react'

import styles from '@/app/(app)/feed-page.module.css'
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
    <section aria-label="Saved items" className={feed.feed}>
      <Tabs
        label="Saved item types"
        tabs={SAVED_TYPES.map((value) => ({
          href: href('/saved', { type: value === 'all' ? null : value }),
          label: LABELS[value],
          current: value === type,
        }))}
      />
      <ContentReveal
        contentKey={`${type}:${query.after ?? query.before ?? 'first'}`}
        name="saved-content"
      >
        <div className={feed.list}>
          <ItemList
            blurNsfw={blurNsfw}
            empty={{
              title: 'Nothing saved yet',
              detail: 'Save posts and comments to find them here.',
            }}
            items={page.items}
            now={now}
          />
        </div>
      </ContentReveal>
      {page.after ? (
        <InfiniteFeed
          base="/saved"
          defaultSort="new"
          extra={extra}
          key={`${type}:${query.after ?? query.before ?? 'first'}:${blurNsfw}`}
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
        after={page.after}
        base="/saved"
        defaultSort="new"
        extra={extra}
        firstFullname={firstFullname(page.items)}
        infinite
        query={query}
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
        <SectionError title="Couldn't load your saved items">
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
