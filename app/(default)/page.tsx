import BackToTop from '@/components/BackToTop/BackToTop'
import BossButton from '@/components/BossButton/BossButton'
import {Posts} from '@/components/Posts/Posts'

export default async function Home() {
  return (
    <>
      <Posts subreddit="all" sort="hot" />
      <BossButton />
      <BackToTop />
    </>
  )
}
