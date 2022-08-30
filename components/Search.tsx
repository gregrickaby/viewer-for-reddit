import { createStyles, Select, TextInput } from '@mantine/core';
import { useDebouncedState } from '@mantine/hooks';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useRedditContext } from './RedditProvider';

const useStyles = createStyles(() => ({
  searchBar: {
    width: '100%',
  },
}));

/**
 * Search component.
 */
export default function Search() {
  const { classes } = useStyles();
  const { sort, setSort } = useRedditContext();
  const [search, setSearch] = useDebouncedState('', 800);
  const router = useRouter();

  /**
   * Handle search input.
   */
  useEffect(() => {
    if (search) {
      router.push(`/r/${search}`);
    }
  }, [search]);

  return (
    <>
      <TextInput
        aria-label="search reddit"
        autoCapitalize="none"
        autoComplete="off"
        className={classes.searchBar}
        defaultValue={search}
        onChange={(event) => setSearch(event.currentTarget.value.trim())}
        pattern="^[^~`^<>]+$"
        placeholder="Search Reddit"
      />
      <Select
        aria-label="sort posts"
        value={sort}
        data={[
          { value: 'hot', label: 'Hot' },
          { value: 'top', label: 'Top' },
          { value: 'new', label: 'New' },
          { value: 'rising', label: 'Rising' },
        ]}
        onChange={setSort}
      />
    </>
  );
}
