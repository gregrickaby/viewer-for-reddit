import {Stack} from '@mantine/core'
import Image from 'next/image'
import notFound from '../public/not-found.webp'

/**
 * No Results component.
 */
export default function NoResults() {
  return (
    <Stack align="center">
      <p>
        Either the Reddit API is down or something else is wrong. Please try
        your search again.
      </p>
      <Image alt="404 not found" priority placeholder="blur" src={notFound} />
    </Stack>
  )
}
