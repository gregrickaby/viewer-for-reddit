import {Card, Skeleton, Stack} from '@mantine/core'
import styles from './CommentsLoading.module.css'

export function CommentsLoading() {
  return (
    <output
      aria-live="polite"
      aria-busy="true"
      aria-describedby="loading-description"
    >
      <Stack gap="md">
        {Array.from({length: 5}, (_, i) => `skeleton-${i}`).map((id) => (
          <Card key={id} padding="md" withBorder>
            <Stack gap="xs">
              <Skeleton height={12} width="30%" />
              <Skeleton height={8} width="100%" />
              <Skeleton height={8} width="90%" />
              <Skeleton height={8} width="85%" mt="xs" />
            </Stack>
          </Card>
        ))}
      </Stack>
      <div id="loading-description" className={styles.srOnly}>
        Loading comments. Please wait.
      </div>
    </output>
  )
}
