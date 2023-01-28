import {Badge, createStyles} from '@mantine/core'
import {useViewportSize} from '@mantine/hooks'
import Head from 'next/head'
import HlsPlayer from '~/components/HlsPlayer'
import {useRedditContext} from '~/components/RedditProvider'
import {Post} from '~/lib/types'

interface BlurProps {
  blurNSFW: boolean
}

const useStyles = createStyles((theme, {blurNSFW}: BlurProps) => ({
  blurred: {
    filter: 'blur(60px)'
  },

  card: {
    overflow: 'hidden',
    paddingBottom: theme.spacing.xl,
    textAlign: 'center'
  },

  link: {
    color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
    textDecoration: 'none'
  },

  media: {
    height: 'auto',
    marginBottom: theme.spacing.sm,
    transition: 'filter 0.3s ease-in-out',
    width: '100%'
  },

  richVideo: {
    filter: blurNSFW ? 'blur(60px)' : ''
  }
}))

/**
 * Card component.
 */
export default function Card(props: Post) {
  const {blurNSFW} = useRedditContext()
  const {classes, cx} = useStyles({blurNSFW})
  const {width} = useViewportSize()

  /**
   * Try and preload the first image.
   *
   * @returns JSX.Element
   */
  function maybePreLoad() {
    if (width > 768 && props.index < 3) {
      return (
        <Head>
          <link
            rel="preload"
            as="image"
            href={
              props?.over_18 && blurNSFW
                ? props?.images?.obfuscated?.url
                : props?.images?.cropped?.url
            }
            crossOrigin="anonymous"
          />
        </Head>
      )
    }

    if (props.index === 0) {
      return (
        <Head>
          <link
            rel="preload"
            as="image"
            href={
              props?.over_18 && blurNSFW
                ? props?.images?.obfuscated?.url
                : props?.images?.cropped?.url
            }
            crossOrigin="anonymous"
          />
        </Head>
      )
    }
  }

  /**
   * Decide whether to lazy load an image or not.
   *
   * @returns string - 'lazy' or 'eager'
   */
  function maybeLazyLoad() {
    // For desktop, eager load the first 6 images.
    if (width > 768) {
      return props.index > 5 ? 'lazy' : 'eager'
    }

    // For mobile, eager load the first image.
    return props.index > 0 ? 'lazy' : 'eager'
  }

  return (
    <div className={classes.card}>
      {(() => {
        switch (props?.post_hint) {
          case 'image':
            return (
              <>
                {maybePreLoad()}
                <a
                  className={classes.link}
                  href={props?.permalink}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <img
                    alt={props?.title}
                    className={classes.media}
                    data-hint="image"
                    decoding="async"
                    height={
                      props?.over_18 && blurNSFW
                        ? props?.images?.obfuscated?.height
                        : props?.images?.cropped?.height
                    }
                    loading={maybeLazyLoad()}
                    src={
                      props?.over_18 && blurNSFW
                        ? props?.images?.obfuscated?.url
                        : props?.images?.cropped?.url
                    }
                    width={
                      props?.over_18 && blurNSFW
                        ? props?.images?.obfuscated?.width
                        : props?.images?.cropped?.width
                    }
                  />
                  {props?.title}
                </a>{' '}
                {props?.over_18 && <Badge color="red">NSFW</Badge>}
              </>
            )
          case 'hosted:video':
            return (
              <>
                <HlsPlayer
                  className={classes.media}
                  src={props?.media?.reddit_video?.hls_url}
                  controls
                  crossOrigin="anonymous"
                  dataHint="hosted:video"
                  height={props?.media?.reddit_video?.height}
                  playsInline
                  poster={
                    props?.over_18 && blurNSFW
                      ? props?.images?.obfuscated?.url
                      : props?.images?.cropped?.url
                  }
                  preload="metadata"
                  width={props?.media?.reddit_video?.width}
                >
                  <source
                    src={props?.media?.reddit_video?.fallback_url}
                    type="video/mp4"
                  />
                </HlsPlayer>
                <a
                  className={classes.link}
                  href={props?.permalink}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {props.title}{' '}
                  {props?.over_18 && <Badge color="red">NSFW</Badge>}
                </a>
              </>
            )
          case 'rich:video':
            return props?.video_preview ? (
              <>
                <video
                  className={cx(classes.media, classes.richVideo)}
                  controls
                  crossOrigin="anonymous"
                  data-hint="rich:video"
                  height={props?.video_preview?.height}
                  muted
                  playsInline
                  preload="metadata"
                  width={props?.video_preview?.width}
                >
                  <source
                    src={props?.video_preview?.fallback_url}
                    type="video/mp4"
                  />
                </video>
                <a
                  className={classes.link}
                  href={props?.permalink}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {props.title}{' '}
                  {props?.over_18 && <Badge color="red">NSFW</Badge>}
                </a>
              </>
            ) : (
              <div
                style={{
                  height: props?.secure_media_embed?.height,
                  width: props?.secure_media_embed?.width
                }}
              >
                <iframe
                  allow="fullscreen"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                  src={props?.secure_media_embed?.media_domain_url}
                  style={{border: 'none', height: '100%', width: '100%'}}
                  title="iframe"
                />
                <a
                  className={classes.link}
                  href={props?.permalink}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {props.title}{' '}
                  {props?.over_18 && <Badge color="red">NSFW</Badge>}
                </a>
              </div>
            )
          case 'link':
            // Search for .gifv....
            if (props?.url.includes('gifv')) {
              return (
                <>
                  <HlsPlayer
                    className={cx(classes.media, {
                      [classes.blurred]: props?.over_18 && blurNSFW
                    })}
                    controls
                    dataHint="link"
                    muted
                    playsInline
                    preload="metadata"
                  >
                    <source
                      src={props?.url.replace('.gifv', '.mp4')}
                      type="video/mp4"
                    />
                  </HlsPlayer>
                  <a
                    className={classes.link}
                    href={props?.permalink}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {props.title}{' '}
                    {props?.over_18 && <Badge color="red">NSFW</Badge>}
                  </a>
                </>
              )
            } else {
              // No media? Return blank.
              return <></>
            }
          default:
            break
        }
      })()}
    </div>
  )
}
