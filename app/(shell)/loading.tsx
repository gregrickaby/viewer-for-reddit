import {TabsSkeleton} from '@/components/skeletons/TabsSkeleton/TabsSkeleton'
import {Container} from '@mantine/core'

/**
 * Loading UI for main layout routes.
 * Shown while route segments are loading.
 *
 * Next.js automatically shows this while fetching data.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/loading
 */
export default function Loading() {
  return (
    <Container size="lg">
      <div style={{maxWidth: '800px'}}>
        <TabsSkeleton />
      </div>
    </Container>
  )
}
