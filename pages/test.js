import {useSub} from 'lib/swr-hooks'
import Card from '@/components/Card'
import NoResults from '@/components/NoResults'

export default function Test() {
  const {posts, isLoading, error} = useSub('pics')

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error!</div>

  return (
    <>
      {posts?.length ? (
        <>
          {posts.map((post, index) => (
            <Card key={index} {...post} />
          ))}
        </>
      ) : (
        <NoResults />
      )}
    </>
  )
}
