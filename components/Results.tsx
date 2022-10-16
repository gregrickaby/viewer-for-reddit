import {Button, createStyles} from '@mantine/core'
import dynamic from 'next/dynamic'
import {useEffect, useState} from 'react'
import {useInView} from 'react-intersection-observer'
import Masonry from 'react-masonry-css'
import Card from '~/components/Card'
import {useRedditContext} from '~/components/RedditProvider'
import SkeletonWrapper from '~/components/SkeletonWrapper'
import {fetchPosts} from '~/lib/helpers'
import {Post} from '~/lib/types'

const DynamicNoResults = dynamic(() => import('./NoResults'), {
  ssr: false
})

const breakpointColumnsObj = {
  default: 3,
  766: 1
}

const useStyles = createStyles((theme) => ({
  masonry: {
    display: 'flex',
    gap: theme.spacing.xl
  },
  loadMore: {
    display: 'flex',
    margin: `${theme.spacing.xl}px auto`
  }
}))

/**
 * Results component.
 */
export default function Results() {
  const {subReddit, sort} = useRedditContext()
  const {classes} = useStyles()
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState<boolean | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
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
    setLoading(false)
  }

  /**
   * Get the initial set of posts.
   */
  async function loadInitialPosts() {
    clearState()
    setLoading(true)
    const data = await fetchPosts({subReddit, sort, lastPost: null})
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
    setLoading(false)
  }

  useEffect(() => {
    loadInitialPosts()
  }, [subReddit, sort]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loading && clicked) {
      infiniteScroll()
    }
  }, [inView]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <SkeletonWrapper />
  }

  if (!posts) {
    return <DynamicNoResults />
  }

  return (
    <>
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className={classes.masonry}
      >
        {posts.map((post) => (
          <Card key={post.id} {...post} />
        ))}
      </Masonry>
      <Button className={classes.loadMore} ref={ref} onClick={infiniteScroll}>
        {loadingMore ? <>Loading...</> : <>Load more</>}
      </Button>
    </>
  )
}
