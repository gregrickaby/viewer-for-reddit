import {Container} from '@mantine/core'

export default async function Home() {
  return (
    <Container size="sm">
      <h2>About</h2>
      <p>
        <strong>Viewer for Reddit</strong> has been a fast, private way to
        browse media on Reddit since 2020.
      </p>
      <p>
        There's no tracking, no ads, and no personalized feeds or algorithms —
        just a clean, fast browsing experience.
      </p>
      <p>
        As the app turns 5 years old, I'm excited to introduce new features: you
        can now save your favorite subreddits and view your recent activity.
        Just open the sidebar to access them anytime.
      </p>
      <p>
        <strong>To get started, try searching for a subreddit above.</strong>
      </p>
    </Container>
  )
}
