import {Shell} from '@/components/layout/Shell/Shell'
import {AuthenticatedSidebarSections} from '@/components/layout/Sidebar/AuthenticatedSidebarSections'
import {PersonalizedNavLinks} from '@/components/layout/Sidebar/PersonalizedNavLinks'
import {SidebarPanel} from '@/components/layout/Sidebar/SidebarPanel'
import {SidebarSectionsSkeleton} from '@/components/skeletons/SidebarSectionsSkeleton/SidebarSectionsSkeleton'
import {appConfig} from '@/lib/config/app.config'
import {Container, Typography} from '@mantine/core'
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
 * About page - displays README content.
 *
 * Static content page that reads and renders the README.md file.
 * No loading state needed as it's server-rendered with local file access.
 */
export default function AboutPage() {
  const filePath = path.join(process.cwd(), 'README.md')
  const fileContent = fs.readFileSync(filePath, 'utf8')

  return (
    <Shell
      sidebarSlot={
        <SidebarPanel
          personalizedLinksSlot={
            <Suspense fallback={null}>
              <PersonalizedNavLinks />
            </Suspense>
          }
          personalizedSectionsSlot={
            <Suspense fallback={<SidebarSectionsSkeleton />}>
              <AuthenticatedSidebarSections />
            </Suspense>
          }
        />
      }
    >
      <Container size="md" py="xl">
        <Typography>
          <ReactMarkdown>{fileContent}</ReactMarkdown>
        </Typography>
      </Container>
    </Shell>
  )
}
