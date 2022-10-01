import {fetchPosts} from '~/lib/helpers'
import {useEffect, useState} from 'react'
import {useInView} from 'react-intersection-observer'
import Card from './Card'
import Masonry from 'react-masonry-css'
import Skeleton from './Skeleton'
const breakpointColumnsObj = {
  default: 3,
  766: 1
}

interface ResultsProps {
  subreddit: string
  sortBy: string
}

/**
 * Results component.
 */
export default function Results({subreddit, sortBy}: ResultsProps) {
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(null)
  const [posts, setPosts] = useState([])
  const [lastPost, setLastPost] = useState(null)
  const [clicked, setClicked] = useState(false)
  const [ref, inView] = useInView({
    rootMargin: '100px 0px'
  })

  /**
   * Helper to force clear all state.
   */
  function clearState() {
    setPosts([])
    setLastPost(null)
    setClicked(false)
    setLoadingMore(null)
  }

  /**
   * Get the initial set of posts.
   */
  async function loadInitialPosts() {
    clearState()
    setLoading(true)
    const data = await fetchPosts({subreddit, sortBy})
    setPosts(data?.posts)
    setLastPost(data?.after)
    setLoading(false)
  }

  /**
   * Activate infinite scroll and get more posts.
   */
  async function infiniteScroll() {
    setLoadingMore(true)
    const data = await fetchPosts({subreddit, lastPost, sortBy})
    setPosts((prevResults) => [...prevResults, ...data.posts])
    setLastPost(data?.after)
    setLoadingMore(false)
    setClicked(true)
  }

  useEffect(() => {
    loadInitialPosts()
  }, [subreddit, sortBy]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loading && clicked) {
      infiniteScroll()
    }
  }, [inView]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <Skeleton />
  }

  return (
    <>
      <Masonry breakpointCols={breakpointColumnsObj} className="flex gap-4">
        {posts.map((post, index) => (
          <Card key={index} {...post} />
        ))}
      </Masonry>
      <button
        ref={ref}
        className="animate mt-16 ml-auto mr-auto flex py-2 px-4 text-white"
        onClick={infiniteScroll}
      >
        {loadingMore ? <>Loading...</> : <>Load more</>}
      </button>
    </>
  )
}
