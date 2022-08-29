import {
  AppShell,
  Avatar,
  Burger,
  Button,
  Group,
  Header,
  MediaQuery,
  Navbar,
  NavLink,
  ScrollArea,
  Text,
  Title,
  useMantineTheme,
} from '@mantine/core';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useRedditContext } from '~/components/RedditProvider';
import ScrollToTop from '~/components/ScrollToTop';
import Search from '~/components/Search';
import { logOut } from '~/lib/helpers';
import { ChildrenProps } from '~/lib/types';

/**
 * Layout component.
 */
export default function Layout({ children }: ChildrenProps) {
  const { app, loading } = useRedditContext();
  const theme = useMantineTheme();
  const { data: session } = useSession();
  const [opened, setOpened] = useState(false);
  const router = useRouter();

  function navDrawerHandler(url: string) {
    setOpened((o) => !o);
    router.push(url);
  }

  if (loading) {
    return <div>Loading...</div>;
  }

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
        <Header height={78} p="lg">
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              gap: '12px',
              height: '100%',
              justifyContent: 'center',
            }}
          >
            <MediaQuery largerThan="xl" styles={{ display: 'none' }}>
              <Burger
                color={theme.colors.gray[6]}
                onClick={() => setOpened((o) => !o)}
                opened={opened}
                size="md"
              />
            </MediaQuery>
            <Search />
          </div>
        </Header>
      }
      navbar={
        <Navbar p="md" hiddenBreakpoint="xl" hidden={!opened} width={{ base: '300' }}>
          {session && (
            <>
              <Navbar.Section>
                <Title
                  order={1}
                  size="h3"
                  onClick={() => navDrawerHandler('/')}
                  style={{
                    cursor: 'pointer',
                    marginLeft: theme.spacing.sm,
                    paddingBottom: theme.spacing.md,
                  }}
                >
                  Reddit Image Viewer
                </Title>
              </Navbar.Section>

              <Navbar.Section grow component={ScrollArea}>
                <NavLink label="Your Communities" childrenOffset={4}>
                  {app.subs &&
                    app.subs.length > 0 &&
                    app.subs
                      .sort((a, b) => a.toLowerCase().localeCompare(b))
                      .map((sub, index) => (
                        <NavLink
                          component="a"
                          href={`/r/${sub}`}
                          key={index}
                          label={sub.toLowerCase()}
                        />
                      ))}
                </NavLink>
                <NavLink label="Custom Feeds" childrenOffset={4}>
                  {app.multis &&
                    app.multis.length > 0 &&
                    app.multis.map((multi, index) => (
                      <NavLink
                        component="a"
                        href={`/m/${multi.data.name}`}
                        key={index}
                        label={multi.data.name}
                      />
                    ))}
                </NavLink>
              </Navbar.Section>

              <Navbar.Section>
                <Group position="apart" pt="md">
                  <Avatar
                    alt={session.user.name}
                    imageProps={{ loading: 'lazy' }}
                    radius="xl"
                    size="md"
                    src={session.user.image}
                  />
                  <Text>Hello, {session.user.name}</Text>
                  <Button onClick={() => logOut()}>Sign out</Button>
                </Group>
              </Navbar.Section>
            </>
          )}
          {!session && <Button onClick={() => signIn()}>Sign in</Button>}
        </Navbar>
      }
    >
      {children}
      <ScrollToTop />
    </AppShell>
  );
}
