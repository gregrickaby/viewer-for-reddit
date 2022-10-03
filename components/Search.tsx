import { Autocomplete, createStyles } from '@mantine/core';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { MdSavedSearch } from 'react-icons/md';
import useSWR from 'swr';
import { fetcher } from '~/lib/helpers';

const useStyles = createStyles(() => ({
  searchBar: {
    width: '100%',
  },
}));

/**
 * Search component.
 *
 * @see https://mantine.dev/core/autocomplete/
 */
export default function Search() {
  const router = useRouter();
  const { classes } = useStyles();
  const [term, setTerm] = useState('');
  const { data: results } = useSWR(`/api/search?term=${term}`, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnMount: false,
  });

  return (
    <Autocomplete
      aria-label="Search"
      icon={<MdSavedSearch />}
      className={classes.searchBar}
      data={results ? results : []}
      onChange={setTerm}
      onItemSubmit={(value) => router.push(`${value.url}`)}
      placeholder="Search"
      nothingFound="No subreddits found."
      value={term}
    />
  );
}
