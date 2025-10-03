import config from '@/lib/config'
import Link from 'next/link'
import {FaHome} from 'react-icons/fa'
import styles from './Breadcrumb.module.css'

export interface BreadcrumbItem {
  label: string
  href: string
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

/**
 * Breadcrumb navigation component.
 *
 * Displays accessible breadcrumb navigation starting with "Home" and
 * followed by the provided items. The last item is the current page
 * and is NOT a link (for accessibility).
 *
 * @example
 * <Breadcrumb items={[
 *   { label: 'r/technology', href: '/r/technology' },
 *   { label: 'Post Title', href: '/r/technology/comments/123' }
 * ]} />
 * // Renders: Home / r/technology / Post Title
 * //          ^link  ^link          ^current (no link)
 */
export function Breadcrumb({items}: Readonly<BreadcrumbProps>) {
  // Always start with Home
  const allItems: BreadcrumbItem[] = [{label: 'Home', href: '/'}, ...items]

  // Generate Schema.org structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: allItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: `${config.baseUrl}${item.href}`
    }))
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(structuredData)}}
      />
      <nav aria-label="Breadcrumb" className={styles.breadcrumbNav}>
        <ol className={styles.breadcrumbList}>
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1

            return (
              <li key={item.href} className={styles.breadcrumbItem}>
                {index > 0 && (
                  <span
                    aria-hidden="true"
                    className={styles.breadcrumbSeparator}
                  >
                    &middot;
                  </span>
                )}
                {isLast ? (
                  <span
                    aria-current="page"
                    className={styles.breadcrumbCurrent}
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link href={item.href} className={styles.breadcrumbLink}>
                    {index === 0 && <FaHome aria-hidden="true" />}
                    {item.label}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
