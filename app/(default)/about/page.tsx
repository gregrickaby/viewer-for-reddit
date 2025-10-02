import config from '@/lib/config'
import {Typography} from '@mantine/core'
import fs from 'fs'
import matter from 'gray-matter'
import type {Metadata} from 'next'
import path from 'path'
import ReactMarkdown from 'react-markdown'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `About - ${config.siteName}`,
    description: `${config.siteName} has been a private, distraction-free way to browse Reddit media since 2020.`,
    alternates: {
      canonical: '/about'
    },
    openGraph: {
      title: `About - ${config.siteName}`,
      description: `${config.siteName} has been a private, distraction-free way to browse Reddit media since 2020.`,
      url: '/about',
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

export default async function About() {
  const filePath = path.join(
    process.cwd(),
    'app',
    '(default)',
    'about',
    'about.md'
  )
  const fileContent = fs.readFileSync(filePath, 'utf8')
  const {content} = matter(fileContent)

  return (
    <Typography>
      <ReactMarkdown>{content}</ReactMarkdown>
    </Typography>
  )
}
