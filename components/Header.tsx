import {useSession, signIn, signOut} from 'next-auth/react'
import {useState} from 'react'

export default function Header() {
  const {data: session} = useSession()
  const [subs, setSubs] = useState()

  async function getSubs() {
    const response = await fetch(
      'https://oauth.reddit.com/subreddits/mine/subscriber/',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer: ${session.accessToken}`
        }
      }
    )
    const subs = await response.json()
    setSubs(subs)
  }

  if (session) {
    return (
      <>
        Hello {session.user.name} <br />
        <pre>{JSON.stringify(session, null, 2)}</pre>
        <button onClick={() => signOut()}>Sign out</button>
        <button onClick={() => getSubs()}>Get Subs</button>
        {<pre>{JSON.stringify(subs, null, 2)}</pre>}
      </>
    )
  }
  return (
    <>
      <button onClick={() => signIn()}>Sign in</button>
    </>
  )
}
