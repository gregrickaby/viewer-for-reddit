import RedditProvider from '../components/RedditContext'
import {getPosts} from '../lib/functions'
import {ChildrenProps} from '../lib/types'
import './globals.css'

export const runtime = 'experimental-edge'

export default async function RootLayout({children}: ChildrenProps) {
  const data = await getPosts({})

  return (
    <html lang="en">
      <head />
      <RedditProvider posts={data}>
        <body>{children}</body>
      </RedditProvider>
    </html>
  )
}
