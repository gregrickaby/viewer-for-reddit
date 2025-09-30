import {Center, Loader} from '@mantine/core'
import styles from './CommentsLoading.module.css'

export function CommentsLoading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <Center>
        <Loader
          aria-describedby="loading-description"
          aria-label="Loading comments..."
          size="md"
        />
      </Center>
      <div id="loading-description" className={styles.srOnly}>
        Comments are being loaded. Please wait.
      </div>
    </div>
  )
}
