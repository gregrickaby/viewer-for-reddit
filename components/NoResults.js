import Image from 'next/image'

export default function NoResults() {
  return (
    <div className="m-auto space-y-4 text-center text-2xl text-red-900 dark:text-red-500">
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
    </div>
  )
}
