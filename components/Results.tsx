'use client'

import LoadingCard from '@/components/LoadingCard'
import Media from '@/components/Media'
import {useRedditContext} from '@/components/RedditProvider'
import classes from '@/components/Results.module.css'
import {fetchPosts} from '@/lib/functions'
import {Post} from '@/lib/types'
import {
  Anchor,
  AspectRatio,
  Button,
  Card,
  Flex,
  SimpleGrid
} from '@mantine/core'
import {useEffect, useState} from 'react'
import {useInView} from 'react-intersection-observer'

/**
 * Results component.
 */
export default function Results() {
  const {subReddit, sort} = useRedditContext()
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

  return (
    <>
      <SimpleGrid cols={{base: 1, sm: 3, lg: 3}}>
        {loading &&
          // loop over and display 24 LoadingCard components
          [...Array(24)].map((_, index) => <LoadingCard key={index} />)}
        {!loading &&
          posts.map((post, index) => (
            <Card className={classes.card} key={index}>
              <AspectRatio ratio={3 / 2}>
                <Media key={post.id} {...post} index={index} />
              </AspectRatio>
              <Card.Section p="md">
                <Anchor className={classes.title} href={post.permalink} mt={8}>
                  {post.title}
                </Anchor>
              </Card.Section>
            </Card>
          ))}
      </SimpleGrid>
      {!loading && (
        <Flex justify="center" align="center" p="xl">
          <Button
            aria-label="load more posts"
            ref={ref}
            onClick={infiniteScroll}
          >
            {loadingMore ? <>Loading...</> : <>Load more</>}
          </Button>
        </Flex>
      )}
    </>
  )
}
