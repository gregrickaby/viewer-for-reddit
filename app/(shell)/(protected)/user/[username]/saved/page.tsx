import {TabsSkeleton} from '@/components/skeletons/TabsSkeleton/TabsSkeleton'
import {SavedItemsList} from '@/components/ui/SavedItemsList/SavedItemsList'
import {fetchSavedItems} from '@/lib/actions/reddit/users'
import {generateListingMetadata} from '@/lib/utils/metadata-helpers'
import {Container, Title} from '@mantine/core'
import type {Metadata} from 'next'
import {Suspense} from 'react'

interface PageProps {
  params: Promise<{
    username: string
  }>
}

/**
 * Generate metadata for saved items page.
 */
export async function generateMetadata({
  params
}: Readonly<PageProps>): Promise<Metadata> {
  const {username} = await params

  return generateListingMetadata({
    title: `${username}'s Saved`,
    description: `View saved posts and comments for Reddit user ${username}`,
    canonicalUrl: `/user/${username}/saved`,
    index: false
  })
}

/**
 * Saved items list - resolves params, fetches initial saved items.
 *
 * @param params - URL params promise (username)
 */
async function SavedItems({
  params
}: Readonly<{
  params: PageProps['params']
}>) {
  const {username} = await params
  const {items, after} = await fetchSavedItems(username)

  return (
    <SavedItemsList
      initialItems={items}
      username={username}
      initialAfter={after}
    />
  )
}

/**
 * Saved items page for a user.
 * Server Component that fetches initial saved items and renders SavedItemsList.
 *
 * @example
 * URL: /user/johndoe/saved
 */
export default function SavedItemsPage({params}: Readonly<PageProps>) {
  return (
    <Container size="lg">
      <Title order={2} mb="md">
        Saved
      </Title>
      <Suspense fallback={<TabsSkeleton />}>
        <SavedItems params={params} />
      </Suspense>
    </Container>
  )
}
