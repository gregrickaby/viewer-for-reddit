import {Custom} from '@/components/Feeds/Custom/Custom'
import BackToTop from '@/components/UI/BackToTop/BackToTop'
import BossButton from '@/components/UI/BossButton/BossButton'
import {Breadcrumb} from '@/components/UI/Breadcrumb/Breadcrumb'
import config from '@/lib/config'
import type {CustomFeedParams, SearchParams, SortingOption} from '@/lib/types'
import type {Metadata} from 'next'
import {Suspense} from 'react'

/**
 * Generate metadata for custom feed page.
 */
export async function generateMetadata(props: {
  params: CustomFeedParams
}): Promise<Metadata> {
  const params = await props.params
  const {customfeed} = params

  return {
    title: `${customfeed} - ${config.siteName}`,
    description: `Viewing posts from custom feed "${customfeed}"`,
    alternates: {
      canonical: `/user/${params.username}/m/${customfeed}`
    },
    robots: {
      index: false,
      follow: false
    },
    openGraph: {
      title: `${customfeed} - ${config.siteName}`,
      description: `Viewing posts from custom feed "${customfeed}"`,
      url: `/user/${params.username}/m/${customfeed}`
    },
    twitter: {
      card: 'summary',
      title: `${customfeed} - ${config.siteName}`,
      description: `Viewing posts from custom feed "${customfeed}"`
    }
  }
}

/**
 * Custom Feed page component.
 *
 * Displays posts from a user's custom feed using authenticated API.
 * Requires user to be logged in as custom feeds are user-specific.
 *
 * This uses the CustomFeedPosts component which calls the authenticated
 * API endpoint with the user's session token.
 *
 * @example
 * // URL: /user/abc123/m/programming
 * // Reddit API path: /user/abc123/m/programming/hot.json (with user token)
 */
export default async function CustomFeedPage(props: {
  params: CustomFeedParams
  searchParams: SearchParams
}) {
  const params = await props.params
  const {username, customfeed} = params
  const searchParams = await props.searchParams
  const sort = searchParams.sort as SortingOption

  return (
    <>
      <Breadcrumb
        items={[
          {label: `u/${username}`, href: `/u/${username}`},
          {
            label: `m/${customfeed}`,
            href: `/user/${username}/m/${customfeed}`
          }
        ]}
      />
      <Suspense fallback={null}>
        <Custom customFeedName={customfeed} sort={sort} username={username} />
      </Suspense>
      <BossButton />
      <BackToTop />
    </>
  )
}
