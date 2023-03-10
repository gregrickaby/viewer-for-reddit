import {Button, createStyles, Flex} from '@mantine/core'
import dynamic from 'next/dynamic'
import {useEffect, useRef, useState} from 'react'
import {useInView} from 'react-intersection-observer'
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
    borderBottom: `1px solid ${theme.colors.gray[6]}`,
    textDecoration: 'none',
    textTransform: 'capitalize',

    '&:hover': {
      borderBottom: '1px solid transparent',
      textDecoration: 'none'
    }
  },

  masonryGrid: {
    padding: '0',
    width: '100%'
  },

  masonryItem: {
    borderRadius: theme.radius.sm,
    width: '20%'
  },

  masonryPhoto: {
    height: 'auto',
    margin: 0,
    padding: '0 24px 24px 0',
    transition: 'opacity 0.45s ease-in-out',
    width: '100%',

    '&.loading': {
      opacity: 0
    },

    '&.loaded': {
      opacity: 1
    }
  }
}))

/**
 * Results component.
 */
export default function Results() {
  const {subReddit, sort} = useRedditContext()
  const {classes, cx} = useStyles()
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState<boolean | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [lastPost, setLastPost] = useState(null)
  const [clicked, setClicked] = useState(false)
  const masonryRef = useRef<HTMLDivElement>(null)
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
   * Render the Masonry grid.
   */
  async function renderGrid() {
    // Dynamically import Masonry and imagesLoaded client-side.
    const Masonry = (await import('masonry-layout')).default
    const imagesLoaded = (await import('imagesloaded')).default
    const grid = masonryRef.current

    // If something goes wrong, bail.
    if (!Masonry || !imagesLoaded || !grid) {
      return
    }

    // Initialize imagesLoaded.
    const imagesLoadedInstance = imagesLoaded(grid)

    // When the images are loading, add a class to the image.
    imagesLoadedInstance.on('progress', (items) => {
      items.images.map((item) => {
        if (item.isLoaded) {
          item.img.classList.remove('loading')
          item.img.classList.add('loaded')
        }
      })
    })

    // After images are all loaded, initialize Masonry.
    imagesLoadedInstance.on('done', () => {
      new Masonry(grid, {
        itemSelector: '.masonry-item',
        columnWidth: '.masonry-column',
        percentPosition: true
      })
    })
  }

  /**
   * Get the initial set of posts.
   */
  async function loadInitialPosts() {
    clearState()
    setLoading(true)
    const data = await fetchPosts({subReddit, sort, lastPost: null})
    setPosts(data?.posts)
    renderGrid()
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
    renderGrid()
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
      <div className={classes.masonryGrid} ref={masonryRef}>
        <div className="masonry-column" style={{width: '20%'}} />
        {posts.map((post) => (
          <div
            className={cx(classes.masonryItem, 'masonry-item')}
            key={post.id}
          >
            <img
              alt={post.title}
              className={cx(classes.masonryPhoto, 'loading')}
              src={post.thumbnail}
            />
          </div>
        ))}
      </div>
      {!loading && (
        <Flex justify="center" align="center" p="xl">
          <Button ref={ref} onClick={infiniteScroll}>
            {loadingMore ? <>Loading...</> : <>Load more</>}
          </Button>
        </Flex>
      )}
    </>
  )
}
