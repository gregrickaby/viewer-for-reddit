import Image from 'next/image'

export default function NoResults() {
  return (
    <div className="no-results">
      <p>No posts found...</p>
      <Image
        className="no-results-image"
        src="/not-found.webp"
        height="212"
        width="426"
        alt="Sorry. No posts found."
      />
    </div>
  )
}
