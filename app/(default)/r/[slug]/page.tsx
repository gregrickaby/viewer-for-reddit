import BackToTop from '@/components/BackToTop/BackToTop'
import BossButton from '@/components/BossButton/BossButton'
import {Posts} from '@/components/Posts/Posts'
import config from '@/lib/config'
import type {Params, SearchParams, SortingOption} from '@/lib/types'
import {Container} from '@mantine/core'

/**
 * Generate metadata.
 */
export async function generateMetadata(props: {params: Params}) {
  const params = await props.params
  const slug = params.slug

  return {
    title: `/r/${slug} - ${config.siteName}`,
    description: `Browse posts in /r/${slug} anonymously with Viewer for Reddit.`,
    alternates: {
      canonical: `${config.siteUrl}r/${slug}`
    },
    openGraph: {
      title: `/r/${slug} - ${config.siteName}`,
      description: `Posts in /r/${slug}, updated in real time.`,
      url: `${config.siteUrl}r/${slug}`,
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
 * The single subreddit page.
 */
export default async function Page(props: {
  params: Params
  searchParams: SearchParams
}) {
  const params = await props.params
  const slug = params.slug
  const searchParams = await props.searchParams
  const sort = searchParams.sort as SortingOption

  return (
    <Container>
      <Posts subreddit={slug} sort={sort} />
      <BossButton />
      <BackToTop />
    </Container>
  )
}
