import config from '@/lib/config'
import {Container, Typography} from '@mantine/core'
import fs from 'fs'
import matter from 'gray-matter'
import path from 'path'
import ReactMarkdown from 'react-markdown'

export async function generateMetadata() {
  return {
    title: `About - ${config.siteName}`,
    description: `${config.siteName} has been a private, distraction-free way to browse Reddit media since 2020.`,
    alternates: {
      canonical: `${config.siteUrl}about`
    },
    openGraph: {
      title: `About - ${config.siteName}`,
      description: `${config.siteName} has been a private, distraction-free way to browse Reddit media since 2020.`,
      url: `${config.siteUrl}about`,
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
    <Container size="sm">
      <Typography>
        <ReactMarkdown>{content}</ReactMarkdown>
      </Typography>
    </Container>
  )
}
