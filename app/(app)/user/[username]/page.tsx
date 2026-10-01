import type { Metadata } from 'next'
import { Suspense } from 'react'
import { FeedSkeleton } from '@/components/feed/feed-section'
import { ItemList, firstFullname } from '@/components/feed/item-list'
import { Pagination } from '@/components/feed/pagination'
import { SortTabs } from '@/components/feed/sort-tabs'
import { SectionError } from '@/components/islands/section-error'
import {
  ContentReveal,
  PageTransition,
  Reveal,
  SkeletonExit,
} from '@/components/motion/transitions'
import { ProfileHeader, ProfileHeaderSkeleton } from '@/components/profile/profile-header'
import { BackLink } from '@/components/ui/back-link'
import { Tabs } from '@/components/ui/tabs'
import { getUsername } from '@/lib/auth/session'
import { getProfile, getUserListing } from '@/lib/reddit/people'
import { handleReadError } from '@/lib/reddit/read-errors'
import { requestTime } from '@/lib/request-time'
import { getSettings } from '@/lib/settings'
import {
  PROFILE_SORTS,
  PROFILE_TABS,
  type ProfileTab,
  feedKey,
  href,
  parseFeedQuery,
  pick,
} from '@/lib/url-state'
import type { ListItem, Page, ProfileView } from '@/lib/view-models'
import feed from '@/components/feed/feed.module.css'
import styles from '../../feed-page.module.css'

type Props = PageProps<'/user/[username]'>

const TAB_LABELS: Record<ProfileTab, string> = {
  overview: 'Overview',
  submitted: 'Posts',
  comments: 'Comments',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  return { title: `u/${username}` }
}

async function Header({ params }: Pick<Props, 'params'>) {
  const { username } = await params
  let profile: ProfileView
  try {
    profile = await getProfile(username)
  } catch (error) {
    handleReadError(error)
    return null
  }
  return <ProfileHeader profile={profile} viewer={await getUsername()} />
}

async function Activity({ params, searchParams }: Pick<Props, 'params' | 'searchParams'>) {
  const [{ username }, search] = await Promise.all([params, searchParams])
  const tab = pick(PROFILE_TABS, search.tab)
  const query = parseFeedQuery(search, PROFILE_SORTS)
  const base = `/user/${username}`
  const extra = { tab: tab === 'overview' ? null : tab }

  let page: Page<ListItem>
  try {
    page = await getUserListing(username, tab, query)
  } catch (error) {
    handleReadError(error)
    return (
      <div className={feed.notice}>
        <p className={feed.noticeTitle}>Reddit won’t show this profile’s activity</p>
      </div>
    )
  }
  const [{ blurNsfw }, now] = await Promise.all([getSettings(), requestTime()])

  return (
    <section className={feed.feed} aria-label="Activity">
      <Tabs
        label="Profile sections"
        tabs={PROFILE_TABS.map((value) => ({
          href: href(base, { tab: value === 'overview' ? null : value }),
          label: TAB_LABELS[value],
          current: value === tab,
        }))}
      />
      <SortTabs base={base} sorts={PROFILE_SORTS} query={query} extra={extra} />
      <ContentReveal name="profile-content" contentKey={`${tab}:${feedKey(query)}`}>
        <div className={feed.list}>
          <ItemList
            items={page.items}
            now={now}
            blurNsfw={blurNsfw}
            empty={{
              title: 'Nothing here yet',
              detail: 'This account hasn’t posted anything here.',
            }}
          />
        </div>
      </ContentReveal>
      <Pagination
        base={base}
        query={query}
        after={page.after}
        firstFullname={firstFullname(page.items)}
        defaultSort="new"
        extra={extra}
      />
    </section>
  )
}

export default function ProfilePage({ params, searchParams }: Props) {
  return (
    <PageTransition>
      <div className={styles.page}>
        <BackLink href="/home">Home</BackLink>
        <SectionError title="Couldn’t load this profile">
          <Suspense
            fallback={
              <SkeletonExit>
                <ProfileHeaderSkeleton />
              </SkeletonExit>
            }
          >
            <Reveal>
              <Header params={params} />
            </Reveal>
          </Suspense>
        </SectionError>
        <SectionError title="Couldn’t load posts and comments">
          <Suspense
            fallback={
              <SkeletonExit>
                <FeedSkeleton />
              </SkeletonExit>
            }
          >
            <Reveal>
              <Activity params={params} searchParams={searchParams} />
            </Reveal>
          </Suspense>
        </SectionError>
      </div>
    </PageTransition>
  )
}
