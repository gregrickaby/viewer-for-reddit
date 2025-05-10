import {Results} from '@/components/Results/Results'
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

  return <Results subreddit={slug} sort={sort} />
}
