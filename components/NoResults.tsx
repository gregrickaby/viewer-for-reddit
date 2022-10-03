import Image from 'next/image'

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
      <div>
        <Image
          alt="404 not found"
          height="212"
          src="/not-found.webp"
          width="426"
        />
      </div>
    </>
  )
}
