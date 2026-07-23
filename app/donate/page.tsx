import {Shell} from '@/components/layout/Shell/Shell'
import {fetchMultireddits} from '@/lib/actions/reddit/multireddits'
import {fetchUserSubscriptions} from '@/lib/actions/reddit/subreddits'
import {getCurrentUserAvatar} from '@/lib/actions/reddit/users'
import {getSession, isAuthenticated} from '@/lib/auth/session'
import {appConfig} from '@/lib/config/app.config'
import {Container, Typography} from '@mantine/core'
import type {Metadata} from 'next'
import fs from 'node:fs'
import path from 'node:path'
import ReactMarkdown from 'react-markdown'

/**
 * Generate metadata for Donate page.
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Donate - ${appConfig.site.name}`,
    description: `Support the development of ${appConfig.site.name}. Your contributions help keep this project free and ad-free.`,
    alternates: {
      canonical: '/donate'
    },
    openGraph: {
      title: `Donate - ${appConfig.site.name}`,
      description: `Support the development of ${appConfig.site.name}. Your contributions help keep this project free and ad-free.`,
      url: '/donate',
      images: [
        {
          url: '/social-share.webp',
          width: 1200,
          height: 630,
          alt: appConfig.site.name
        }
      ]
    }
  }
}

/**
 * Donate page - displays donation options and information.
 *
 * Static content page that reads and renders the content.md file.
 * No loading state needed as it's server-rendered with local file access.
 */
export default async function DonatePage() {
  const donateContent = fs.readFileSync(
    path.join(process.cwd(), 'app', 'donate', 'content.md'),
    'utf-8'
  )

  const authenticated = await isAuthenticated()

  if (!authenticated) {
    return (
      <Shell>
        <Container size="md" py="xl">
          <Typography>
            <ReactMarkdown>{donateContent}</ReactMarkdown>
          </Typography>
        </Container>
      </Shell>
    )
  }

  const session = await getSession()

  const [subscriptions, multireddits, avatarUrl] = await Promise.all([
    fetchUserSubscriptions(),
    fetchMultireddits(),
    getCurrentUserAvatar()
  ])

  return (
    <Shell
      username={session.username}
      avatarUrl={avatarUrl ?? undefined}
      subscriptions={subscriptions}
      multireddits={multireddits}
    >
      <Container size="md" py="xl">
        <Typography>
          <ReactMarkdown>{donateContent}</ReactMarkdown>
        </Typography>
      </Container>
    </Shell>
  )
}
