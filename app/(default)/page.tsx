import {Homepage} from '@/components/Layout/Homepage/Homepage'
import BackToTop from '@/components/UI/BackToTop/BackToTop'
import BossButton from '@/components/UI/BossButton/BossButton'
import config from '@/lib/config'
import {Container, Loader, Stack, Text, Title} from '@mantine/core'
import type {Metadata} from 'next'
import {Suspense} from 'react'

/**
 * Generate metadata for homepage.
 */
export const metadata: Metadata = {
  title: `${config.siteName} - ${config.siteDescription}`,
  description: config.metaDescription,
  alternates: {
    canonical: '/'
  },
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    title: config.siteName,
    description: config.metaDescription,
    url: config.baseUrl,
    type: 'website',
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

/**
 * Loading fallback with SEO-friendly content for crawlers.
 */
function HomepageFallback() {
  return (
    <Container size="md">
      <Stack gap="lg" align="center" mt="xl">
        <Title order={1}>{config.siteName}</Title>
        <Text size="lg" c="dimmed" ta="center">
          {config.siteDescription}
        </Text>
        <Loader size="lg" />
        <Text size="sm" c="dimmed">
          Loading popular posts from Reddit...
        </Text>
      </Stack>
    </Container>
  )
}

/**
 * The main landing page component.
 */
export default async function Home() {
  return (
    <>
      <Suspense fallback={<HomepageFallback />}>
        <Homepage />
      </Suspense>
      <BossButton />
      <BackToTop />
    </>
  )
}
