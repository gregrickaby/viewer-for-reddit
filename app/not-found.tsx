import {Stack} from '@mantine/core'
import Image from 'next/image'
import notFound from '../public/not-found.webp'

/**
 * 404 Not Found component.
 */
export default function NotFound() {
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
