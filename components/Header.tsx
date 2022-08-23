import {signIn, signOut, useSession} from 'next-auth/react'
import {useRedditContext} from '~/components/RedditProvider'

export default function Header() {
  const {data: session} = useSession()
  const {isError, isLoading, userData} = useRedditContext()

  if (session && !isError && !isLoading) {
    return (
      <>
        Hello {session.user.name} <br />
        <pre>{JSON.stringify(session, null, 2)}</pre>
        <button onClick={() => signOut()}>Sign out</button>
        {userData && <pre>{JSON.stringify(userData, null, 2)}</pre>}
      </>
    )
  }

  return (
    <>
      <button onClick={() => signIn()}>Sign in</button>
    </>
  )
}
