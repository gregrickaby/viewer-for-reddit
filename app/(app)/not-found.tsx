import { LinkButton } from '@/components/ui/button'
import styles from './status-page.module.css'

/** Reddit said 404: a community, user, or post that doesn't exist (design §12). */
export default function NotFound() {
  return (
    <div className={styles.root}>
      <h1 className={styles.title}>Nothing here</h1>
      <p className={styles.detail}>
        Reddit couldn’t find that. It may have been deleted, or the name may be misspelled.
      </p>
      <LinkButton href="/home" transitionTypes={['nav-back']}>
        Back to Home
      </LinkButton>
    </div>
  )
}
