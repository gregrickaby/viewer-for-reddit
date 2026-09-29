import type { Metadata } from 'next'
import { MultiFeedPage } from '@/components/feed/multi-feed'

export async function generateMetadata({
  params,
}: PageProps<'/user/[username]/m/[multi]'>): Promise<Metadata> {
  const { username, multi } = await params
  return { title: `m/${multi} by u/${username}` }
}

/** Someone else's (public) multireddit. */
export default function UserMultiPage({
  params,
  searchParams,
}: PageProps<'/user/[username]/m/[multi]'>) {
  return (
    <MultiFeedPage
      multi={params.then((value) => value.multi)}
      owner={params.then((value) => value.username)}
      searchParams={searchParams}
    />
  )
}
