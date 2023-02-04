import {
  AspectRatio,
  Badge,
  Button,
  Card,
  createStyles,
  SimpleGrid,
  Text
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
    textAlign: 'center',

    '&:hover': {
      backgroundColor:
        theme.colorScheme === 'dark'
          ? theme.colors.dark[4]
          : theme.colors.gray[3]
    }
  },

  title: {
    fontWeight: 700
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
          <Card
            className={classes.card}
            component="a"
            href={post.permalink}
            key={post.title}
            p="sm"
            radius="sm"
          >
            <AspectRatio ratio={3 / 2}>
              <Media key={post.id} {...post} index={index} />
            </AspectRatio>
            <Card.Section p="md">
              <Text className={classes.title} mt={8}>
                {post.title} {post?.over_18 && <Badge color="red">NSFW</Badge>}
              </Text>
            </Card.Section>
          </Card>
        ))}
      </SimpleGrid>
      {!loading && (
        <Button className={classes.loadMore} ref={ref} onClick={infiniteScroll}>
          {loadingMore ? <>Loading...</> : <>Load more</>}
        </Button>
      )}
    </>
  )
}
