import {useSession, signIn, signOut} from 'next-auth/react'
import {useSubs} from '~/lib/helpers'

export default function Header() {
  const {data: session} = useSession()
  const {subs, isLoading, isError} = useSubs(session?.user?.name ? true : false)

  if (session) {
    return (
      <>
        Hello {session.user.name} <br />
        <pre>{JSON.stringify(session, null, 2)}</pre>
        <button onClick={() => signOut()}>Sign out</button>
        {!isLoading && !isError && <pre>{JSON.stringify(subs, null, 2)}</pre>}
      </>
    )
  }
  return (
    <>
      <button onClick={() => signIn()}>Sign in</button>
    </>
  )
}
