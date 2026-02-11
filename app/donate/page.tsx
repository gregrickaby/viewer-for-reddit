import {AppLayout} from '@/components/layout/AppLayout/AppLayout'
import {
  fetchMultireddits,
  fetchUserSubscriptions,
  getCurrentUserAvatar
} from '@/lib/actions/reddit'
import {getSession} from '@/lib/auth/session'
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
  const session = await getSession()
  const isAuthenticated = !!session.accessToken

  const [subscriptions, multireddits, avatarUrl] = await Promise.all([
    isAuthenticated ? fetchUserSubscriptions() : Promise.resolve([]),
    isAuthenticated ? fetchMultireddits() : Promise.resolve([]),
    isAuthenticated ? getCurrentUserAvatar() : Promise.resolve(null)
  ])

  const donateContent = fs.readFileSync(
    path.join(process.cwd(), 'app', 'donate', 'content.md'),
    'utf-8'
  )

  return (
    <AppLayout
      isAuthenticated={isAuthenticated}
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
    </AppLayout>
  )
}
