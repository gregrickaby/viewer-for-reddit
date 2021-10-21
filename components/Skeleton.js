export default function Skeleton() {
  return (
    <div className="space-y-12 text-center m-auto">
      <h2 className="text-2xl">Loading Posts...</h2>
      <div className="animate skeleton-bone"></div>
      <div className="animate skeleton-bone"></div>
      <div className="animate skeleton-bone"></div>
    </div>
  )
}
