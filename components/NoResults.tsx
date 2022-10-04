import Image from 'next/future/image'
import notFound from '../public/not-found.webp'

/**
 * No Results component.
 */
export default function NoResults() {
  return (
    <>
      <p>
        Either the Reddit API is down or something else is wrong. Please try
        your search again.
      </p>
      <Image alt="404 not found" src={notFound} />
    </>
  )
}
