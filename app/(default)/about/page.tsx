import {Breadcrumb} from '@/components/UI/Breadcrumb/Breadcrumb'
import config from '@/lib/config'
import {parseFrontmatter} from '@/lib/utils/formatting/markdown/parseFrontmatter'
import {Typography} from '@mantine/core'
import type {Metadata} from 'next'
import fs from 'node:fs'
import path from 'node:path'
import ReactMarkdown from 'react-markdown'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `About - ${config.siteName}`,
    description: `Since 2020 ${config.siteName} has been the best way to lurk on Reddit. Learn more about this project, its features, and the tech behind it.`,
    alternates: {
      canonical: '/about'
    },
    openGraph: {
      title: `About - ${config.siteName}`,
      description: `Since 2020 ${config.siteName} has been the best way to lurk on Reddit. Learn more about this project, its features, and the tech behind it.`,
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
  const filePath = path.join(process.cwd(), 'README.md')
  const fileContent = fs.readFileSync(filePath, 'utf8')
  const {content} = parseFrontmatter(fileContent)

  return (
    <>
      <Breadcrumb items={[{label: 'About', href: '/about'}]} />
      <Typography>
        <ReactMarkdown>{content}</ReactMarkdown>
      </Typography>
    </>
  )
}
