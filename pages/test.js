import useSWR from 'swr'

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function Test() {
  const {data, error} = useSWR('/api/submission?id=i', fetcher)

  if (error) return <div>Failed to load</div>
  if (!data) return <div>Loading...</div>

  return (
    <pre>{JSON.stringify(data, null, 2)}</pre>
  )
}
