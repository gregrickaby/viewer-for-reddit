import {useEffect} from 'react'

/**
 * Update meta tags dynamically on the client side for social sharing.
 * This allows proper Open Graph tags when users share links while
 * avoiding SSR Reddit API calls for bots.
 *
 * @param title - Page title
 * @param description - Page description
 * @param image - Open Graph image URL
 */
export function useUpdateMeta(
  title?: string,
  description?: string,
  image?: string
) {
  useEffect(() => {
    // Update or create meta tags with property attribute (for OG tags)
    const updateMetaTagByProperty = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`)
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('property', property)
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', content)
    }

    // Update or create meta tags with name attribute (for Twitter tags)
    const updateMetaTagByName = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`)
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', name)
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', content)
    }

    // Always update og:url to current page URL (even if no other params)
    updateMetaTagByProperty('og:url', window.location.href)

    if (!title && !description && !image) return

    // Update document title
    if (title) {
      document.title = title
    }

    if (title) {
      updateMetaTagByProperty('og:title', title)
      updateMetaTagByName('twitter:title', title)
    }

    if (description) {
      updateMetaTagByProperty('og:description', description)
      updateMetaTagByName('twitter:description', description)

      // Also update standard description meta tag
      updateMetaTagByName('description', description)
    }

    if (image) {
      updateMetaTagByProperty('og:image', image)
      updateMetaTagByName('twitter:image', image)
    }
  }, [title, description, image])
}
