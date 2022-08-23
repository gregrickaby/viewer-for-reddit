import { createContext, useContext, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useLocalStorage } from '@mantine/hooks';
import { useUserData } from '~/lib/helpers';
import { ChildrenProps } from '~/lib/types';

export interface RedditProviderProps {
  app: any;
  setApp: (app: {}) => void;
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
  const { data: session } = useSession();
  const { userData } = useUserData(!!session?.user?.name);
  const [app, setApp] = useLocalStorage({ key: 'riv-app' });

  const providerValues = {
    app,
    setApp,
  };

  useEffect(() => {
    if (userData) {
      setApp(userData);
    }
  }, [userData]);

  return (
    <RedditContext.Provider value={providerValues as RedditProviderProps}>
      {children}
    </RedditContext.Provider>
  );
}
