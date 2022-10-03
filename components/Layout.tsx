import {
  ActionIcon,
  Avatar,
  Button,
  createStyles,
  Drawer,
  Group,
  NavLink,
  Select,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import { MdBurstMode, MdDarkMode, MdDynamicFeed, MdHome, MdOutlineBookmarks } from 'react-icons/md';
import { useRedditContext } from '~/components/RedditProvider';
import ScrollToTop from '~/components/ScrollToTop';
import Search from '~/components/Search';
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
  const theme = useMantineTheme();
  const { classes } = useStyles();
  const { data: session } = useSession();
  const { app, sort, setSort } = useRedditContext();
  const { toggleColorScheme } = useMantineColorScheme();
  const [userDrawer, toggleUserDrawer] = useState(false);

  return (
    <>
      <header className={classes.headerContainer}>
        <MdBurstMode size={64} />
        <Search />
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
        <Avatar
          alt={session?.user?.name ? session.user.name : 'Sign In'}
          onClick={() => toggleUserDrawer(true)}
          radius="xl"
          size="md"
          src={session?.user?.image ? session.user.image : ''}
        />
        <Drawer position="right" opened={userDrawer} onClose={() => toggleUserDrawer(false)}>
          <Group position="center" style={{ padding: theme.spacing.md }}>
            {!session && (
              <>
                <Button onClick={() => signIn()}>Sign In</Button>
                <ActionIcon
                  color={theme.colors.blue[3]}
                  onClick={() => toggleColorScheme()}
                  size="lg"
                  title="Toggle color scheme"
                  variant="outline"
                >
                  <MdDarkMode />
                </ActionIcon>
              </>
            )}

            {session && (
              <>
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
                <Button onClick={() => signOut()}>Sign Out</Button>
              </>
            )}
          </Group>
        </Drawer>
      </header>
      <div className={classes.feedContainer}>{children}</div>
      <ScrollToTop />
    </>
  );
}
