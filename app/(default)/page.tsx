import BackToTop from '@/components/UI/BackToTop/BackToTop'
import BossButton from '@/components/UI/BossButton/BossButton'
import {Homepage} from '@/components/Layout/Homepage/Homepage'

/**
 * The main landing page component.
 */
export default async function Home() {
  return (
    <>
      <Homepage />
      <BossButton />
      <BackToTop />
    </>
  )
}
