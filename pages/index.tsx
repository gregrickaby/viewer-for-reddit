import {
  AppShell,
  Navbar,
  Header,
  Title,
  Footer,
  Burger,
  MediaQuery,
  useMantineTheme,
  TextInput,
  Button,
  Box,
  Group,
} from '@mantine/core';
import { useDebouncedState } from '@mantine/hooks';
import { signIn, useSession } from 'next-auth/react';
import { useState } from 'react';
import { useRedditContext } from '~/components/RedditProvider';
import { logOut, useSubreddit } from '~/lib/helpers';

export default function Homepage() {
  const { app } = useRedditContext();
  const { data: session } = useSession();
  const [opened, setOpened] = useState(false);
  const theme = useMantineTheme();
  const [search, setSearch] = useDebouncedState('itookapicture', 800);
  const { posts } = useSubreddit(search, true);

  return (
    <AppShell
      padding="md"
      styles={{
        main: {
          background: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
        },
      }}
      navbarOffsetBreakpoint="xl"
      navbar={
        <Navbar p="md" hiddenBreakpoint="xl" hidden={!opened} width={{ sm: 200, lg: 300 }}>
          {session && (
            <>
              Hello {session.user.name} <br />
              <Button onClick={() => logOut()} type="submit">
                Sign out
              </Button>
              <pre>{JSON.stringify(app, null, 2)}</pre>
            </>
          )}
          {!session && (
            <Button onClick={() => signIn()} type="submit">
              Sign in
            </Button>
          )}
        </Navbar>
      }
      header={
        <Header height={60} p="xs">
          <Group position="apart">
            <MediaQuery largerThan="xl" styles={{ display: 'none' }}>
              <Burger
                opened={opened}
                onClick={() => setOpened((o) => !o)}
                size="sm"
                color={theme.colors.gray[6]}
                mr="xl"
              />
            </MediaQuery>
            <Title order={1} size="h3">
              Reddit Image Viewer
            </Title>
            <TextInput
              autoComplete="off"
              placeholder="itookapicture"
              aria-label="search for a subreddit"
              onChange={(event) => setSearch(event.currentTarget.value)}
            />
          </Group>
        </Header>
      }
      footer={
        <Footer height={60} p="md">
          &copy; 2020-2022 Greg Rickaby
        </Footer>
      }
    >
      <pre>{JSON.stringify(posts, null, 2)}</pre>
    </AppShell>
  );
}
