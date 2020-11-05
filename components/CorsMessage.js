export default function CorsMessage() {
  return (
    <div className="mt-4 italic text-sm max-w-md m-auto">
      <p className="text-lg font-bold mb-2">Not seeing anything?</p>
      <p>
        Either Reddit&apos;s API is slow right now, or you may be experiencing{' '}
        <a
          className="underline"
          href="https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS"
        >
          CORS
        </a>{' '}
        issues. You may need to disable tracking protection and your ad blocker
        for this website.
      </p>
    </div>
  )
}
