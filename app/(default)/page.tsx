import BackToTop from '@/components/BackToTop/BackToTop'
import BossButton from '@/components/BossButton/BossButton'
import {Homepage} from '@/components/Homepage/Homepage'

export default async function Home() {
  return (
    <>
      <Homepage />
      <BossButton />
      <BackToTop />
    </>
  )
}
