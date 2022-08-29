import { useLocalStorage } from '@mantine/hooks';
import { useSession } from 'next-auth/react';
import { createContext, useContext, useEffect, useState } from 'react';
import useSWR, { preload } from 'swr';
import { fetcher } from '~/lib/helpers';
import { ChildrenProps } from '~/lib/types';

export interface RedditProviderProps {
  app: any;
  loading: boolean;
  sort: string;
  subreddit: string;
  setApp: (app: {}) => void;
  setLoading: (loading: boolean) => void;
  setSort: (sort: string) => void;
  setSubreddit: (subreddit: string) => void;
}

// Create the RedditContext.
const RedditContext = createContext({} as RedditProviderProps);

// Create useRedditContext hook.
export const useRedditContext = () => useContext(RedditContext);

preload('/api/userdata', fetcher);

/**
 * RedditProvider component.
 *
 * This component is used to hold global state and provide it to child components.
 */
export default function RedditProvider({ children }: ChildrenProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const { data: userData, error } = useSWR(session?.user?.name ? '/api/userdata' : null, fetcher, {
    revalidateOnFocus: false,
  });
  const [app, setApp] = useLocalStorage({ key: 'riv-app' });
  const [sort, setSort] = useLocalStorage({ key: 'riv-sort', defaultValue: 'hot' });
  const [subreddit, setSubreddit] = useLocalStorage({
    key: 'riv-subreddit',
    defaultValue: 'itookapicture',
  });

  const providerValues = {
    app,
    loading,
    setApp,
    setLoading,
    setSort,
    setSubreddit,
    sort,
    subreddit,
  };

  useEffect(() => {
    setLoading(true);
    if (userData) {
      setApp(userData);
      setLoading(!error && !userData);
    }
  }, [userData]);

  return (
    <RedditContext.Provider value={providerValues as RedditProviderProps}>
      {children}
    </RedditContext.Provider>
  );
}
