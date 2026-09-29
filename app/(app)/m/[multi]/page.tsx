import type { Metadata } from 'next'
import { MultiFeedPage } from '@/components/feed/multi-feed'

export async function generateMetadata({ params }: PageProps<'/m/[multi]'>): Promise<Metadata> {
  const { multi } = await params
  return { title: `m/${multi}` }
}

/** One of the viewer's own multireddits. */
export default function OwnMultiPage({ params, searchParams }: PageProps<'/m/[multi]'>) {
  return (
    <MultiFeedPage
      multi={params.then((value) => value.multi)}
      owner={null}
      searchParams={searchParams}
    />
  )
}
