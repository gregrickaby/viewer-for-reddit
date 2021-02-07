import {fetchData} from 'functions/fetchData'
import PropTypes from 'prop-types'
import {useEffect, useState} from 'react'
import Card from './Card'
import NoResults from './NoResults'
import Skeleton from './Skeleton'

export default function Results({subreddit}) {
  const [loading, setLoading] = useState(null)
  const [loadingMore, setLoadingMore] = useState(null)
  const [posts, setPosts] = useState([])
  const [lastPost, setLastPost] = useState(null)

  function clearState() {
    setPosts([])
    setLastPost(null)
  }

  async function loadInitialPosts() {
    setLoading(true)
    clearState()
    const data = await fetchData(subreddit)
    setPosts(data?.posts)
    setLastPost(data?.after)
    setLoading(false)
  }

  async function loadMorePosts() {
    setLoadingMore(true)
    const data = await fetchData(subreddit, lastPost)
    setPosts((prevResults) => [...prevResults, ...data?.posts])
    setLastPost(data?.after)
    setLoadingMore(false)
  }

  useEffect(() => {
    loadInitialPosts()
  }, [subreddit])

  if (loading) {
    return <Skeleton />
  }

  return (
    <main className="space-y-12">
      {posts?.length ? (
        <>
          {posts.map((post) => (
            <Card key={post?.id} {...post} />
          ))}
          <button
            className="animate flex m-auto py-2 px-4 text-white"
            onClick={loadMorePosts}
          >
            {loadingMore ? <>Loading...</> : <>Load More Posts</>}
          </button>
        </>
      ) : (
        <NoResults />
      )}
    </main>
  )
}

Results.propTypes = {
  subreddit: PropTypes.string.isRequired
}
