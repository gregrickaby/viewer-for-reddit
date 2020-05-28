const CorsMessage = () => (
  <div className="mt-4 italic text-sm max-w-md m-auto">
    <p className="text-lg font-bold mb-2">Not seeing anything?</p>
    <p>
      Due to{' '}
      <a
        className="underline"
        href="https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS"
      >
        CORS
      </a>{' '}
      issues, you may need to disable tracking protection and your ad blocker
      for this website.
    </p>
  </div>
)

export default CorsMessage
