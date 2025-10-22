import {Homepage} from '@/components/Layout/Homepage/Homepage'
import BackToTop from '@/components/UI/BackToTop/BackToTop'
import BossButton from '@/components/UI/BossButton/BossButton'
import {Suspense} from 'react'

/**
 * The main landing page component.
 */
export default async function Home() {
  return (
    <>
      <Suspense fallback={null}>
        <Homepage />
      </Suspense>
      <BossButton />
      <BackToTop />
    </>
  )
}
