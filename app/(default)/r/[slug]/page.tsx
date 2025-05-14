import BackToTop from '@/components/BackToTop/BackToTop'
import BossButton from '@/components/BossButton/BossButton'
import {Posts} from '@/components/Posts/Posts'
import config from '@/lib/config'
import type {Params, SearchParams, SortingOption} from '@/lib/types'

/**
 * Generate metadata.
 */
export async function generateMetadata(props: {params: Params}) {
  const params = await props.params
  const slug = params.slug

  return {
    title: `/r/${slug} - ${config.siteName}`
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
    <>
      <Posts subreddit={slug} sort={sort} />
      <BossButton />
      <BackToTop />
    </>
  )
}
