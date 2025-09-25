import BackToTop from '@/components/BackToTop/BackToTop'
import BossButton from '@/components/BossButton/BossButton'
import {Homepage} from '@/components/Homepage/Homepage'
import {Container} from '@mantine/core'

export default async function Home() {
  return (
    <Container>
      <Homepage />
      <BossButton />
      <BackToTop />
    </Container>
  )
}
