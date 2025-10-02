import BackToTop from '@/components/BackToTop/BackToTop'
import BossButton from '@/components/BossButton/BossButton'
import {UserProfile} from '@/components/UserProfile/UserProfile'
import {getUserProfile} from '@/lib/actions/getUserProfile'
import config from '@/lib/config'
import type {UserParams} from '@/lib/types'
import type {Metadata} from 'next'

/**
 * Generate metadata.
 */
export async function generateMetadata(props: {
  params: UserParams
}): Promise<Metadata> {
  const params = await props.params
  const username = params.username
  const data = await getUserProfile(username)

  const displayName = data?.name ? `/u/${data.name}` : `/u/${username}`
  const title = `${displayName} - ${config.siteName}`
  const description = data?.subreddit?.public_description
    ? data.subreddit.public_description
    : `View ${displayName} profile, posts, and comments with Viewer for Reddit.`

  return {
    title,
    description,
    alternates: {
      canonical: `/u/${username}`
    },
    openGraph: {
      title,
      description,
      url: `/u/${username}`,
      images: [
        {
          url: data?.icon_img || '/social-share.webp',
          width: data?.icon_img ? 256 : 1200,
          height: data?.icon_img ? 256 : 630,
          alt: displayName
        }
      ]
    }
  }
}

/**
 * User profile page displaying profile data, posts, and comments.
 */
export default async function UserProfilePage(props: {params: UserParams}) {
  const params = await props.params
  const {username} = params

  return (
    <>
      <UserProfile username={username} />
      <BossButton />
      <BackToTop />
    </>
  )
}
