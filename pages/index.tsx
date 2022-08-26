import {
  AppShell,
  Burger,
  Button,
  Group,
  Header,
  Kbd,
  LoadingOverlay,
  MediaQuery,
  Navbar,
  ScrollArea,
  Text,
  TextInput,
  Title,
  useMantineTheme,
} from '@mantine/core';
import { useDebouncedState } from '@mantine/hooks';
import { signIn, useSession } from 'next-auth/react';
import { useState } from 'react';
import { Masonry } from 'masonic';
import { useRedditContext } from '~/components/RedditProvider';
import { logOut, useSubreddit } from '~/lib/helpers';
import { MasonryCard } from '~/components/MasonryCard';

/**
 * Homepage component.
 */
export default function Homepage() {
  const { app } = useRedditContext();
  const { data: session } = useSession();
  const [opened, setOpened] = useState(false);
  const theme = useMantineTheme();
  const [search, setSearch] = useDebouncedState('itookapicture', 800);
  const { posts, isLoading } = useSubreddit(search, true);

  return (
    <AppShell
      padding="md"
      styles={{
        main: {
          background: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
        },
      }}
      navbarOffsetBreakpoint="xl"
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
              Reddit Image Viewer <Kbd>alpha</Kbd>
            </Title>
            <TextInput
              autoComplete="off"
              style={{ width: '33%' }}
              placeholder="itookapicture"
              aria-label="search for a subreddit"
              onChange={(event) => setSearch(event.currentTarget.value)}
            />
          </Group>
        </Header>
      }
      navbar={
        <Navbar p="md" hiddenBreakpoint="xl" hidden={!opened} width={{ sm: 200, lg: 300 }}>
          {session && (
            <>
              <Navbar.Section grow component={ScrollArea} mt={16}>
                <Title size="h3" mb={8}>
                  Your Subreddits
                </Title>
                {app.subs
                  .sort((a, b) => a.toLowerCase().localeCompare(b))
                  .map((sub) => (
                    <Text variant="link" key={sub} onClick={() => setSearch(sub)}>
                      {sub.toLowerCase()}
                    </Text>
                  ))}
              </Navbar.Section>
              <Navbar.Section grow component={ScrollArea} mt={16}>
                <Title size="h3" mb={8}>
                  Your Multis
                </Title>
                {app.multis.map((multi) => (
                  <Text key={multi.data.name}>{multi.data.name}</Text>
                ))}
                {app.multis[0].data.subreddits
                  .sort((a, b) => a.name.toLowerCase().localeCompare(b.name))
                  .map((sub) => (
                    <Text variant="link" key={sub} onClick={() => setSearch(sub.name)}>
                      {sub.name.toLowerCase()}
                    </Text>
                  ))}
              </Navbar.Section>
              <Navbar.Section>
                <Group position="apart">
                  <Text size={24}>Hello {session.user.name}</Text>
                  <img src={session.user.image} alt={session.user.name} height={48} width={48} />
                </Group>
                <Button onClick={() => logOut()}>Sign out</Button>
              </Navbar.Section>
            </>
          )}
          {!session && <Button onClick={() => signIn()}>Sign in</Button>}
        </Navbar>
      }
    >
      {!!posts?.posts && !isLoading && (
        <Masonry
          items={posts.posts}
          render={MasonryCard}
          columnGutter={16}
          columnWidth={300}
          overscanBy={1}
        />
      )}
      <LoadingOverlay visible={isLoading} overlayOpacity={0} />
    </AppShell>
  );
}
