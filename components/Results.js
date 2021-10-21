import {fetchData} from 'functions/fetchData'
import PropTypes from 'prop-types'
import {useEffect, useState} from 'react'
import {useInView} from 'react-intersection-observer'
import Card from './Card'
import NoResults from './NoResults'
import Skeleton from './Skeleton'

export default function Results({subreddit, sortBy}) {
  const [ref, inView] = useInView({
    rootMargin: '200px 0px'
  })
  const [loading, setLoading] = useState(null)
  const [loadingMore, setLoadingMore] = useState(null)
  const [posts, setPosts] = useState([])
  const [lastPost, setLastPost] = useState(null)
  const [clicked, setClicked] = useState(false)

  /**
   * Helper to force clear all state.
   */
  function clearState() {
    setPosts([])
    setLastPost(null)
    setClicked(false)
  }

  /**
   * Get the initial set of posts.
   */
  async function loadInitialPosts() {
    setLoading(true)
    const data = await fetchData({subreddit, sortBy})
    clearState()
    setPosts(data?.posts)
    setLastPost(data?.after)
    setLoading(false)
  }

  /**
   * Get more posts.
   */
  async function loadMorePosts() {
    setLoadingMore(true)
    const data = await fetchData({subreddit, lastPost, sortBy})
    setPosts((prevResults) => [...prevResults, ...data?.posts])
    setLastPost(data?.after)
    setLoadingMore(false)
    setClicked(true)
  }

  useEffect(() => {
    loadInitialPosts()
  }, [subreddit, sortBy]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (clicked) {
      loadMorePosts()
    }
  }, [inView]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <Skeleton />
  }

  return (
    <main className="space-y-12">
      {posts?.length ? (
        <>
          {posts.map((post, index) => (
            <Card key={index} {...post} />
          ))}
          <button
            ref={ref}
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
  sortBy: PropTypes.string,
  subreddit: PropTypes.string.isRequired
}
