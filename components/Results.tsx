import {
  Anchor,
  AspectRatio,
  Button,
  Card,
  createStyles,
  Flex,
  SimpleGrid
} from '@mantine/core'
import dynamic from 'next/dynamic'
import {useEffect, useState} from 'react'
import {useInView} from 'react-intersection-observer'
import Media from '~/components/Media'
import {useRedditContext} from '~/components/RedditProvider'
import {fetchPosts} from '~/lib/helpers'
import {Post} from '~/lib/types'

const DynamicNoResults = dynamic(() => import('./NoResults'), {
  ssr: false
})

const useStyles = createStyles((theme) => ({
  card: {
    backgroundColor:
      theme.colorScheme === 'dark'
        ? theme.colors.dark[5]
        : theme.colors.gray[2],
    textAlign: 'center'
  },

  title: {
    textDecoration: 'none',
    textTransform: 'capitalize',

    '&:hover': {
      textDecoration: 'underline'
    }
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

  if (!posts) {
    return <DynamicNoResults />
  }

  return (
    <>
      <SimpleGrid
        cols={4}
        breakpoints={[
          {maxWidth: 1280, cols: 3, spacing: 'md'},
          {maxWidth: 1024, cols: 2, spacing: 'md'},
          {maxWidth: 600, cols: 1, spacing: 'sm'}
        ]}
      >
        {posts.map((post, index) => (
          <Card className={classes.card} key={index}>
            <AspectRatio ratio={1 / 1}>
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
