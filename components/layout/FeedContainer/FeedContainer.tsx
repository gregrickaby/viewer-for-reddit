import {Container, Stack} from '@mantine/core'

interface FeedContainerProps {
  children: React.ReactNode
}

/**
 * Shared width and alignment wrapper for feed/listing pages (home,
 * subreddit, user profile, saved, multireddit, search, post detail).
 * Keeps content flush against the sidebar at a consistent reading width
 * instead of floating centered in the page.
 */
export function FeedContainer({children}: Readonly<FeedContainerProps>) {
  return (
    <Container size="lg" mx={0}>
      <Stack gap="xl" maw={800}>
        {children}
      </Stack>
    </Container>
  )
}
