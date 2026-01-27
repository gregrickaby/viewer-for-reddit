/**
 * Metadata generation helpers for Reddit posts and pages
 */

import {appConfig} from '@/lib/config/app.config'
import type {RedditPost} from '@/lib/types/reddit'
import type {Metadata} from 'next'

/**
 * Extracts the best image from a Reddit post for social sharing.
 * Priority: real thumbnail → preview image → fallback
 *
 * @param post - Reddit post object
 * @param fallbackImage - Fallback image URL (default: '/social-share.webp')
 * @returns Object containing image URL, width, and height
 *
 * @example
 * ```typescript
 * const {url, width, height} = getPostImageMetadata(post)
 * // Returns: {url: 'https://...', width: 1200, height: 630}
 * ```
 */
export function getPostImageMetadata(
  post: RedditPost,
  fallbackImage = '/social-share.webp'
): {url: string; width: number; height: number} {
  // Ignore placeholder thumbnails
  const placeholders = ['default', 'self', 'nsfw', 'spoiler', '']

  // Use post thumbnail if available and not a placeholder
  if (post.thumbnail && !placeholders.includes(post.thumbnail)) {
    return {
      url: post.thumbnail,
      width: 1200,
      height: 630
    }
  }

  // Use preview image if available
  if (post.preview?.images?.[0]?.source?.url) {
    const source = post.preview.images[0].source
    return {
      url: source.url,
      width: source.width || 1200,
      height: source.height || 630
    }
  }

  // Fallback to default social share image
  return {
    url: fallbackImage,
    width: 1200,
    height: 630
  }
}

/**
 * Generates page metadata for a Reddit post.
 * Creates optimized title, description, and OpenGraph/Twitter Card metadata.
 *
 * @param post - Reddit post object
 * @param canonicalUrl - Canonical URL for this page
 * @returns Next.js Metadata object
 *
 * @example
 * ```typescript
 * const metadata = generatePostMetadata(post, '/r/askreddit/comments/abc123/title')
 * // Returns full Metadata object with title, description, OpenGraph, etc.
 * ```
 */
export function generatePostMetadata(
  post: RedditPost,
  canonicalUrl: string
): Metadata {
  // Generate title with subreddit context
  const title = `${post.title} - r/${post.subreddit} - ${appConfig.site.name}`

  // Use selftext for description if available, otherwise create from metadata
  const description = post.selftext
    ? post.selftext.slice(0, 160)
    : `${post.title} - Posted by u/${post.author} in r/${post.subreddit}`

  // Get the best image for social sharing
  const {
    url: imageUrl,
    width: imageWidth,
    height: imageHeight
  } = getPostImageMetadata(post)

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl
    },
    robots: {
      index: false,
      follow: true
    },
    openGraph: {
      title: post.title,
      description,
      url: canonicalUrl,
      type: 'article',
      images: [
        {
          url: imageUrl,
          width: imageWidth,
          height: imageHeight,
          alt: post.title
        }
      ],
      siteName: appConfig.site.name
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: [imageUrl]
    }
  }
}

/**
 * Configuration options for generating listing page metadata.
 */
export interface ListingMetadataOptions {
  /**
   * Page title (will be appended with site name)
   * @example "r/AskReddit" or "Search: nextjs"
   */
  title: string

  /**
   * Page description for meta tags and social sharing
   * @example "Browse posts in r/AskReddit with Reddit Viewer"
   */
  description: string

  /**
   * Canonical URL path (relative or absolute)
   * @example "/r/askreddit" or "/search/nextjs"
   */
  canonicalUrl: string

  /**
   * Whether search engines should index this page
   * @default false (don't index Reddit content pages)
   */
  index?: boolean

  /**
   * Whether search engines should follow links on this page
   * @default false (prevent crawlers from consuming Reddit API tokens)
   */
  follow?: boolean

  /**
   * Image URL for social sharing
   * @default "/social-share.webp"
   */
  imageUrl?: string

  /**
   * OpenGraph type
   * @default "website"
   */
  ogType?: 'website' | 'article'

  /**
   * Featured post to extract image from (optional)
   * If provided, will use getPostImageMetadata to get the best image
   */
  featuredPost?: RedditPost
}

/**
 * Generates page metadata for listing pages (subreddits, search, profiles).
 * Provides consistent metadata structure across all listing pages.
 *
 * @param options - Configuration for generating metadata
 * @returns Next.js Metadata object
 *
 * @example
 * ```typescript
 * // Subreddit listing
 * const metadata = generateListingMetadata({
 *   title: `r/${subreddit}`,
 *   description: `Browse posts in r/${subreddit} with ${appConfig.site.name}`,
 *   canonicalUrl: `/r/${subreddit}`,
 *   index: false
 * })
 *
 * // Search results with featured post image
 * const metadata = generateListingMetadata({
 *   title: `Search: ${query}`,
 *   description: `Search results for "${query}" on ${appConfig.site.name}`,
 *   canonicalUrl: `/search/${query}`,
 *   featuredPost: posts[0] // Use first post's image
 * })
 * ```
 */
export function generateListingMetadata(
  options: ListingMetadataOptions
): Metadata {
  const {
    title,
    description,
    canonicalUrl,
    index = false,
    follow = false,
    imageUrl,
    ogType = 'website',
    featuredPost
  } = options

  // Generate full title with site name
  const fullTitle = `${title} - ${appConfig.site.name}`

  // Determine image to use: featured post → custom → fallback
  let socialImage = {
    url: imageUrl || '/social-share.webp',
    width: 1200,
    height: 630
  }

  if (featuredPost) {
    socialImage = getPostImageMetadata(featuredPost, socialImage.url)
  }

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: canonicalUrl
    },
    robots: {
      index,
      follow
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: ogType,
      images: [
        {
          url: socialImage.url,
          width: socialImage.width,
          height: socialImage.height,
          alt: title
        }
      ],
      siteName: appConfig.site.name
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [socialImage.url]
    }
  }
}
