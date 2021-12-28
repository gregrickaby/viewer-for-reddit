export default function Skeleton() {
  return (
    <>
      <h2 className="sr-only">Loading...</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 place-items-center gap-4">
        <div className="skeleton-bone"></div>
        <div className="skeleton-bone"></div>
        <div className="skeleton-bone"></div>
        <div className="skeleton-bone"></div>
      </div>
    </>
  )
}
