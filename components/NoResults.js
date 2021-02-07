import Image from 'next/image'

export default function NoResults() {
  return (
    <div className="text-center text-2xl text-red-900 dark:text-red-500 m-auto space-y-4">
      <p>
        Reddit is either down or something else is wrong. Please try your search
        again.
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
