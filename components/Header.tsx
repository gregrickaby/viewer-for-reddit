import { signIn, useSession } from 'next-auth/react';
import { useRedditContext } from '~/components/RedditProvider';
import { logOut } from '~/lib/helpers';

export default function Header() {
  const { app } = useRedditContext();
  const { data: session } = useSession();

  if (session) {
    return (
      <>
        Hello {session.user.name} <br />
        <button onClick={() => logOut()} type="submit">
          Sign out
        </button>
        <pre>{JSON.stringify(app, null, 2)}</pre>
      </>
    );
  }

  return (
    <>
      <button onClick={() => signIn()} type="submit">
        Sign in
      </button>
    </>
  );
}
