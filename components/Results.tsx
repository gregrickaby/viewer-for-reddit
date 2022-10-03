import {useEffect, useState} from 'react'
import {useInView} from 'react-intersection-observer'
import Masonry from 'react-masonry-css'
import {fetchPosts} from '~/lib/helpers'
import Card from './Card'
import {useRedditContext} from './RedditProvider'
import SkeletonWrapper from './SkeletonWrapper'
const breakpointColumnsObj = {
  default: 3,
  766: 1
}

/**
 * Results component.
 */
export default function Results() {
  const {subReddit, sort} = useRedditContext()
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
    const data = await fetchPosts({subReddit, sort})
    setPosts(data?.posts)
    setLastPost(data?.after)
    setLoading(false)
  }

  /**
   * Activate infinite scroll and get more posts.
   */
  async function infiniteScroll() {
    setLoadingMore(true)
    const data = await fetchPosts({subReddit, lastPost, sort})
    setPosts((prevResults) => [...prevResults, ...data.posts])
    setLastPost(data?.after)
    setLoadingMore(false)
    setClicked(true)
  }

  useEffect(() => {
    loadInitialPosts()
  }, [subReddit, sort]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loading && clicked) {
      infiniteScroll()
    }
  }, [inView]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !posts) {
    return <SkeletonWrapper />
  }

  return (
    <>
      <Masonry
        breakpointCols={breakpointColumnsObj}
        style={{display: 'flex', gap: '16px'}}
        className="my-masonry-grid"
      >
        {posts.map((post) => (
          <Card key={post.id} {...post} />
        ))}
      </Masonry>
      <button ref={ref} onClick={infiniteScroll}>
        {loadingMore ? <>Loading...</> : <>Load more</>}
      </button>
    </>
  )
}
