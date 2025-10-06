import {Breadcrumb} from '@/components/Breadcrumb/Breadcrumb'
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
  const {content} = matter(fileContent)

  return (
    <>
      <Breadcrumb items={[{label: 'About', href: '/about'}]} />
      <Typography>
        <ReactMarkdown>{content}</ReactMarkdown>
      </Typography>
    </>
  )
}
