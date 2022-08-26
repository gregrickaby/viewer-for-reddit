import {
  AppShell,
  Badge,
  Burger,
  Button,
  Card,
  Footer,
  Group,
  Header,
  Kbd,
  LoadingOverlay,
  MediaQuery,
  Navbar,
  ScrollArea,
  SimpleGrid,
  Text,
  TextInput,
  Title,
  useMantineTheme,
} from '@mantine/core';
import { useDebouncedState } from '@mantine/hooks';
import { signIn, useSession } from 'next-auth/react';
import { useState } from 'react';
import Media from '~/components/Media';
import { useRedditContext } from '~/components/RedditProvider';
import { logOut, useSubreddit } from '~/lib/helpers';

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
      footer={
        <Footer height={60} p="md">
          &copy; 2020-2022 Greg Rickaby
        </Footer>
      }
    >
      <SimpleGrid
        breakpoints={[
          { maxWidth: 980, cols: 2, spacing: 'xl' },
          { maxWidth: 755, cols: 1, spacing: 'xl' },
        ]}
        cols={3}
        m={theme.spacing.xl * 2}
        spacing={theme.spacing.xl * 2}
      >
        {posts &&
          !isLoading &&
          posts?.posts?.map((post, index) => (
            <Card key={index} shadow="sm" p="lg" radius="md" withBorder>
              <Card.Section>
                <Media {...post} />
              </Card.Section>

              <Group position="apart" mt="md" mb="xs">
                <Text weight={500}>{post.title}</Text>
                <Badge color="green" variant="light">
                  {post.ups}
                </Badge>
              </Group>

              <Button
                variant="light"
                color="blue"
                fullWidth
                mt="md"
                radius="md"
                component="a"
                href={post.permalink}
              >
                View Post
              </Button>
            </Card>
          ))}
      </SimpleGrid>
      <LoadingOverlay visible={isLoading} overlayOpacity={0} />
    </AppShell>
  );
}
