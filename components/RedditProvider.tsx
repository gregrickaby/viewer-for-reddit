import { useLocalStorage } from '@mantine/hooks';
import { useSession } from 'next-auth/react';
import { createContext, useContext, useEffect } from 'react';
import useSWR from 'swr';
import config from '~/lib/config';
import { fetcher } from '~/lib/helpers';
import { ChildrenProps } from '~/lib/types';

export interface RedditProviderProps {
  app: any;
  sort: string;
  setApp: (app: {}) => void;
  setSort: (sort: string) => void;
}

// Create the RedditContext.
const RedditContext = createContext({} as RedditProviderProps);

// Create useRedditContext hook.
export const useRedditContext = () => useContext(RedditContext);

/**
 * RedditProvider component.
 *
 * This component is used to hold global state and provide it to child components.
 */
export default function RedditProvider({ children }: ChildrenProps) {
  // Get the session from next-auth.
  const { data: session } = useSession();

  // Query the user's reddit account.
  const {
    data: userData,
    isLoading,
    error,
  } = useSWR(session?.user?.name ? '/api/userdata' : null, fetcher, {
    revalidateOnFocus: false,
  });

  // Set our local storage variables.
  const [app, setApp] = useLocalStorage({ key: 'riv-app' });
  const [sort, setSort] = useLocalStorage({
    key: 'riv-sort',
    defaultValue: config.redditApi.sort,
  });

  // Set the user data.
  useEffect(() => {
    if (userData && !isLoading && !error) {
      setApp(userData);
    }
  }, [session]);

  // Set the global state.
  const providerValues = {
    app,
    setApp,
    setSort,
    sort,
  };

  return (
    <RedditContext.Provider value={providerValues as RedditProviderProps}>
      {children}
    </RedditContext.Provider>
  );
}
