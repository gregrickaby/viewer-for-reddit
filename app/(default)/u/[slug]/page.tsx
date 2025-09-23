import BackToTop from '@/components/BackToTop/BackToTop'
import BossButton from '@/components/BossButton/BossButton'
import {UserProfile} from '@/components/UserProfile/UserProfile'
import config from '@/lib/config'
import type {Params, SearchParams, SortingOption} from '@/lib/types'

/**
 * Generate metadata for user profile pages.
 */
export async function generateMetadata(props: {params: Params}) {
  const params = await props.params
  const username = params.slug

  return {
    title: `/u/${username} - ${config.siteName}`,
    description: `View posts from Reddit user /u/${username} with Viewer for Reddit.`,
    alternates: {
      canonical: `${config.siteUrl}u/${username}`
    },
    openGraph: {
      title: `/u/${username} - ${config.siteName}`,
      description: `Posts from /u/${username}, updated in real time.`,
      url: `${config.siteUrl}u/${username}`,
      images: [
        {
          url: `${config.siteUrl}social-share.webp`,
          width: 1200,
          height: 630,
          alt: config.siteName
        }
      ]
    }
  }
}

/**
 * The user profile page.
 */
export default async function Page(props: {
  params: Params
  searchParams: SearchParams
}) {
  const params = await props.params
  const username = params.slug
  const searchParams = await props.searchParams
  const sort = searchParams.sort as SortingOption

  return (
    <>
      <UserProfile username={username} sort={sort} />
      <BackToTop />
      <BossButton />
    </>
  )
}
