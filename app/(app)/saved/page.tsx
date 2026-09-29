import type { Metadata } from 'next'
import { Suspense } from 'react'
import { FeedSkeleton } from '@/components/feed/feed-section'
import { ItemList, firstFullname } from '@/components/feed/item-list'
import { Pagination } from '@/components/feed/pagination'
import { SectionError } from '@/components/islands/section-error'
import {
  ContentReveal,
  PageTransition,
  Reveal,
  SkeletonExit,
} from '@/components/motion/transitions'
import { Tabs } from '@/components/ui/tabs'
import { getSaved } from '@/lib/reddit/people'
import { requestTime } from '@/lib/request-time'
import { getSettings } from '@/lib/settings'
import { SAVED_TYPES, type SavedType, href, parseFeedQuery, pick } from '@/lib/url-state'
import feed from '@/components/feed/feed.module.css'
import styles from '../feed-page.module.css'

export const metadata: Metadata = { title: 'Saved' }

const LABELS: Record<SavedType, string> = { all: 'All', links: 'Posts', comments: 'Comments' }
/** Saved items have no sort; this only fills `FeedQuery`. */
const SORTS = ['new'] as const

async function SavedSection({ searchParams }: Pick<PageProps<'/saved'>, 'searchParams'>) {
  const params = await searchParams
  const type = pick(SAVED_TYPES, params.type)
  const query = parseFeedQuery(params, SORTS)
  const [page, { blurNsfw }, now] = await Promise.all([
    getSaved(type, query),
    getSettings(),
    requestTime(),
  ])
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
      <Pagination
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
