import {Saved} from '@/components/Feeds/Saved/Saved'
import BackToTop from '@/components/UI/BackToTop/BackToTop'
import BossButton from '@/components/UI/BossButton/BossButton'
import {Breadcrumb} from '@/components/UI/Breadcrumb/Breadcrumb'
import config from '@/lib/config'
import type {Metadata} from 'next'
import {Suspense} from 'react'

interface SavedPageParams {
  params: Promise<{username: string}>
}

/**
 * Generate metadata for saved posts page.
 */
export async function generateMetadata(
  props: SavedPageParams
): Promise<Metadata> {
  const params = await props.params
  const {username} = params

  return {
    title: `Saved Posts - ${config.siteName}`,
    description: `Viewing saved posts for u/${username}`,
    alternates: {
      canonical: `/user/${username}/saved`
    },
    robots: {
      index: false,
      follow: false
    },
    openGraph: {
      title: `Saved Posts - ${config.siteName}`,
      description: `Viewing saved posts for u/${username}`,
      url: `/user/${username}/saved`
    },
    twitter: {
      card: 'summary',
      title: `Saved Posts - ${config.siteName}`,
      description: `Viewing saved posts for u/${username}`
    }
  }
}

async function SavedContent(props: Readonly<SavedPageParams>) {
  const params = await props.params
  const {username} = params

  return (
    <>
      <Breadcrumb
        items={[
          {label: `u/${username}`, href: `/u/${username}`},
          {
            label: 'Saved Posts',
            href: `/user/${username}/saved`
          }
        ]}
      />
      <Saved username={username} />
    </>
  )
}

/**
 * Saved Posts page component.
 *
 * Displays posts that the authenticated user has saved on Reddit.
 * Requires user to be logged in as saved posts are user-specific.
 *
 * This uses the Saved component which calls the authenticated
 * API endpoint with the user's session token.
 *
 * @example
 * // URL: /user/abc123/saved
 * // Reddit API path: /user/abc123/saved.json (with user token)
 */
export default function SavedPage(props: Readonly<SavedPageParams>) {
  return (
    <>
      <Suspense fallback={null}>
        <SavedContent params={props.params} />
      </Suspense>
      <BossButton />
      <BackToTop />
    </>
  )
}
