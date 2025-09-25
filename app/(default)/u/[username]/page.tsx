import BackToTop from '@/components/BackToTop/BackToTop'
import BossButton from '@/components/BossButton/BossButton'
import {UserProfile} from '@/components/UserProfile/UserProfile'
import config from '@/lib/config'
import type {UserParams} from '@/lib/types'
import {Container} from '@mantine/core'

/**
 * Generate metadata.
 */
export async function generateMetadata(props: {params: UserParams}) {
  const params = await props.params
  const username = params.username

  return {
    title: `/u/${username} - ${config.siteName}`,
    description: `View /u/${username} profile, posts, and comments anonymously with Viewer for Reddit.`,
    alternates: {
      canonical: `${config.siteUrl}u/${username}`
    },
    openGraph: {
      title: `/u/${username} - ${config.siteName}`,
      description: `Profile and posts by /u/${username}, updated in real time.`,
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
 * User profile page displaying profile data, posts, and comments.
 */
export default async function UserProfilePage(props: {params: UserParams}) {
  const params = await props.params
  const {username} = params

  return (
    <Container>
      <UserProfile username={username} />
      <BossButton />
      <BackToTop />
    </Container>
  )
}
