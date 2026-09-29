import type { Metadata } from 'next'
import { LinkButton } from '@/components/ui/button'
import status from './(app)/status-page.module.css'
import styles from './not-found.module.css'

export const metadata: Metadata = { title: 'Not found' }

/** An address this app doesn't have (the signed-in shell has its own for Reddit 404s). */
export default function NotFound() {
  return (
    <main className={`${status.root} ${styles.page}`}>
      <h1 className={status.title}>This page doesn’t exist</h1>
      <p className={status.detail}>Check the address, or head back to your home feed.</p>
      <LinkButton href="/home">Back to Home</LinkButton>
    </main>
  )
}
