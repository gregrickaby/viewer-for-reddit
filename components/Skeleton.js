export default function Skeleton() {
  return (
    <div className="space-y-12 text-align center m-auto">
      <div className="animate skeleton-bone"></div>
      <div className="animate skeleton-bone"></div>
      <div className="animate skeleton-bone"></div>
      <p className="mt-4">Loading posts...</p>
    </div>
  )
}
