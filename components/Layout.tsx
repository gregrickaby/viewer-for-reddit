import {
  ActionIcon,
  AppShell,
  Avatar,
  Burger,
  Button,
  createStyles,
  Group,
  Header,
  MediaQuery,
  Navbar,
  NavLink,
  ScrollArea,
  Text,
  Title,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { MdDarkMode, MdDynamicFeed, MdHome, MdOutlineBookmarks } from 'react-icons/md';
import { useRedditContext } from '~/components/RedditProvider';
import ScrollToTop from '~/components/ScrollToTop';
import Search from '~/components/Search';
import { logOut } from '~/lib/helpers';
import { ChildrenProps } from '~/lib/types';

const useStyles = createStyles((theme) => ({
  headerContainer: {
    alignItems: 'center',
    display: 'flex',
    gap: '16px',
    height: '100%',
  },

  logo: {
    cursor: 'pointer',
    minWidth: 'fit-content',
  },

  navLink: {
    padding: theme.spacing.md,
  },

  navFooter: {
    borderTop: `1px solid ${
      theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]
    }`,

    padding: theme.spacing.sm,
  },

  feedContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.xl,
    margin: '0 auto',
    maxWidth: '640px',
  },
}));

/**
 * Layout component.
 */
export default function Layout({ children }: ChildrenProps) {
  const { app } = useRedditContext();
  const { data: session } = useSession();
  const router = useRouter();
  const { classes } = useStyles();
  const { toggleColorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const [navBarOpen, setNavBarOpen] = useState(false);

  function navDrawerHandler(url: string) {
    setNavBarOpen((o) => !o);
    router.push(url);
  }

  return (
    <AppShell
      padding={theme.spacing.xl}
      navbarOffsetBreakpoint="md"
      header={
        <Header height={84} p={theme.spacing.lg}>
          <div className={classes.headerContainer}>
            <MediaQuery largerThan="md" styles={{ display: 'none' }}>
              <Burger
                color={theme.colors.blue[3]}
                onClick={() => setNavBarOpen((o) => !o)}
                opened={navBarOpen}
                size="md"
              />
            </MediaQuery>
            <MediaQuery smallerThan="md" styles={{ display: 'none' }}>
              <Title
                className={classes.logo}
                onClick={() => navDrawerHandler('/')}
                order={1}
                size="h4"
              >
                Reddit Image Viewer
              </Title>
            </MediaQuery>
            <Search />
            <ActionIcon
              color={theme.colors.blue[3]}
              onClick={() => toggleColorScheme()}
              size="lg"
              title="Toggle color scheme"
              variant="outline"
            >
              <MdDarkMode />
            </ActionIcon>
          </div>
        </Header>
      }
      navbar={
        <Navbar hiddenBreakpoint="md" hidden={!navBarOpen} width={{ base: '310' }}>
          {session && (
            <>
              <Navbar.Section grow component={ScrollArea}>
                <NavLink
                  className={classes.navLink}
                  component="a"
                  href="/"
                  icon={<MdHome />}
                  label="Frontpage"
                />
                <NavLink
                  childrenOffset={8}
                  className={classes.navLink}
                  icon={<MdOutlineBookmarks />}
                  label="Your Communities"
                >
                  {app.subs &&
                    app.subs.length > 0 &&
                    app.subs
                      .sort((a, b) => a.toLowerCase().localeCompare(b))
                      .map((sub, index) => (
                        <NavLink
                          component="a"
                          href={`/r/${sub}`}
                          key={index}
                          label={`r/${sub.toLowerCase()}`}
                        />
                      ))}
                </NavLink>
                <NavLink
                  childrenOffset={8}
                  className={classes.navLink}
                  icon={<MdDynamicFeed />}
                  label="Custom Feeds"
                >
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

              <Navbar.Section className={classes.navFooter}>
                <Group position="apart">
                  <Avatar
                    alt={session.user.name}
                    imageProps={{ loading: 'lazy' }}
                    radius="xl"
                    size="md"
                    src={session.user.image}
                  />
                  <Text>Hello, {session.user.name}</Text>
                  <Button variant="outline" onClick={() => logOut()}>
                    Sign out
                  </Button>
                </Group>
              </Navbar.Section>
            </>
          )}
          {!session && (
            <Button variant="outline" onClick={() => signIn()}>
              Sign in
            </Button>
          )}
        </Navbar>
      }
    >
      <div className={classes.feedContainer}>{children}</div>
      <ScrollToTop />
    </AppShell>
  );
}
