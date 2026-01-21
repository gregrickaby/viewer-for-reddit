import {AppLayout} from '@/components/layout/AppLayout/AppLayout'
import {
  fetchMultireddits,
  fetchUserSubscriptions,
  getCurrentUserAvatar
} from '@/lib/actions/reddit'
import {getSession} from '@/lib/auth/session'
import {appConfig} from '@/lib/config/app.config'
import {Container, Skeleton, Typography} from '@mantine/core'
import type {Metadata} from 'next'
import fs from 'node:fs'
import path from 'node:path'
import {Suspense} from 'react'
import ReactMarkdown from 'react-markdown'

/**
 * Generate metadata for About page.
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `About - ${appConfig.site.name}`,
    description: `Learn more about ${appConfig.site.name}, its features, and the tech behind it.`,
    alternates: {
      canonical: '/about'
    },
    openGraph: {
      title: `About - ${appConfig.site.name}`,
      description: `Learn more about ${appConfig.site.name}, its features, and the tech behind it.`,
      url: '/about',
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
 * About page content component - fetches data and renders README.
 */
async function AboutPageContent() {
  const filePath = path.join(process.cwd(), 'README.md')
  const fileContent = fs.readFileSync(filePath, 'utf8')

  const session = await getSession()
  const isAuthenticated = !!session.accessToken

  const [subscriptions, multireddits, avatarUrl] = await Promise.all([
    isAuthenticated ? fetchUserSubscriptions() : Promise.resolve([]),
    isAuthenticated ? fetchMultireddits() : Promise.resolve([]),
    isAuthenticated ? getCurrentUserAvatar() : Promise.resolve(null)
  ])

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
          <ReactMarkdown>{fileContent}</ReactMarkdown>
        </Typography>
      </Container>
    </AppLayout>
  )
}

/**
 * Loading skeleton for About page.
 */
function AboutPageSkeleton() {
  return (
    <AppLayout isAuthenticated={false} subscriptions={[]} multireddits={[]}>
      <Container size="md" py="xl">
        <Skeleton height={40} mb="xl" width="60%" />
        <Skeleton height={20} mb="md" />
        <Skeleton height={20} mb="md" />
        <Skeleton height={20} mb="md" width="80%" />
        <Skeleton height={20} mb="xl" />
        <Skeleton height={20} mb="md" />
        <Skeleton height={20} mb="md" width="90%" />
      </Container>
    </AppLayout>
  )
}

/**
 * About page - displays README content.
 *
 * Reads and renders the README.md file as the about page content.
 */
export default function AboutPage() {
  return (
    <Suspense fallback={<AboutPageSkeleton />}>
      <AboutPageContent />
    </Suspense>
  )
}
