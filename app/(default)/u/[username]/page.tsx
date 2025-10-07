import BackToTop from '@/components/UI/BackToTop/BackToTop'
import BossButton from '@/components/UI/BossButton/BossButton'
import {Breadcrumb} from '@/components/UI/Breadcrumb/Breadcrumb'
import {User} from '@/components/Feeds/User/User'
import config from '@/lib/config'
import type {UserParams} from '@/lib/types'
import type {Metadata} from 'next'

/**
 * Generate static metadata for user profile pages.
 */
export async function generateMetadata(props: {
  params: UserParams
}): Promise<Metadata> {
  const params = await props.params
  const username = params.username

  const title = `u/${username} - ${config.siteName}`
  const description = `View u/${username} profile, posts, and comments with Viewer for Reddit.`

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
          url: '/social-share.webp',
          width: 1200,
          height: 630,
          alt: config.siteName
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
      <Breadcrumb items={[{label: `u/${username}`, href: `/u/${username}`}]} />
      <User username={username} />
      <BossButton />
      <BackToTop />
    </>
  )
}
