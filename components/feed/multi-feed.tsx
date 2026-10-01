import { Suspense } from 'react'
import { SectionError } from '@/components/islands/section-error'
import { PageTransition, Reveal, SkeletonExit } from '@/components/motion/transitions'
import { BackLink } from '@/components/ui/back-link'
import { getUsername } from '@/lib/auth/session'
import { LISTING_SORTS } from '@/lib/url-state'
import { FeedSection, FeedSkeleton } from './feed-section'
import styles from './multi-feed.module.css'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

type MultiFeedProps = {
  multi: Promise<string>
  /** `null` for `/m/[multi]`: the viewer's own multi. */
  owner: Promise<string> | null
  searchParams: SearchParams
}

async function MultiFeed({ multi, owner, searchParams }: MultiFeedProps) {
  const [name, ownerName] = await Promise.all([multi, owner ?? getUsername()])
  if (!ownerName) return null
  const base = owner ? `/user/${ownerName}/m/${name}` : `/m/${name}`

  return (
    <>
      <div>
        <h1 className={styles.title}>m/{name}</h1>
        {owner ? <p className={styles.owner}>by u/{ownerName}</p> : null}
      </div>
      <FeedSection
        source={{ type: 'multi', owner: ownerName, name }}
        base={base}
        sorts={LISTING_SORTS}
        searchParams={searchParams}
        showSubreddit
      />
    </>
  )
}

/** The page body shared by `/m/[multi]` and `/user/[username]/m/[multi]`. */
export function MultiFeedPage(props: MultiFeedProps) {
  return (
    <PageTransition>
      <div className={styles.page}>
        <BackLink href="/home">Home</BackLink>
        <SectionError title="Couldn’t load this multireddit">
          <Suspense
            fallback={
              <SkeletonExit>
                <div className={styles.page}>
                  <span className={`skeleton ${styles.titleSkeleton}`} aria-hidden="true" />
                  <FeedSkeleton />
                </div>
              </SkeletonExit>
            }
          >
            <Reveal>
              <div className={styles.page}>
                <MultiFeed {...props} />
              </div>
            </Reveal>
          </Suspense>
        </SectionError>
      </div>
    </PageTransition>
  )
}
