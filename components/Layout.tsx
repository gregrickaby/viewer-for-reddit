import {
  Accordion,
  AppShell,
  Burger,
  Button,
  Group,
  Header,
  Kbd,
  List,
  MediaQuery,
  Navbar,
  ScrollArea,
  Text,
  Title,
  useMantineTheme,
} from '@mantine/core';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useRedditContext } from '~/components/RedditProvider';
import Search from '~/components/Search';
import { logOut } from '~/lib/helpers';
import { ChildrenProps } from '~/lib/types';

/**
 * Layout component.
 */
export default function Layout({ children }: ChildrenProps) {
  const { app } = useRedditContext();
  const theme = useMantineTheme();
  const { data: session } = useSession();
  const [opened, setOpened] = useState(false);
  const router = useRouter();

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
        <Navbar p="md" hiddenBreakpoint="xl" hidden={!opened} width={{ sm: 350 }}>
          {session && (
            <>
              <Navbar.Section>
                <Title
                  order={1}
                  size="h3"
                  onClick={() => router.push(`/`)}
                  style={{ cursor: 'pointer' }}
                >
                  Reddit Image Viewer <Kbd>beta</Kbd>
                </Title>
              </Navbar.Section>

              <Navbar.Section grow component={ScrollArea}>
                <Accordion defaultValue="subreddits">
                  <Accordion.Item value="subreddits">
                    <Accordion.Control pl="0">Your Subreddits</Accordion.Control>
                    <Accordion.Panel>
                      <List>
                        {!!app.subs &&
                          app.subs
                            .sort((a, b) => a.toLowerCase().localeCompare(b))
                            .map((sub, index) => (
                              <List.Item key={index}>
                                <Text
                                  component="a"
                                  onClick={() => router.push(`/r/${sub}`)}
                                  style={{ cursor: 'pointer' }}
                                  variant="link"
                                >
                                  {sub.toLowerCase()}
                                </Text>
                              </List.Item>
                            ))}
                      </List>
                    </Accordion.Panel>
                  </Accordion.Item>

                  <Accordion.Item value="multis">
                    <Accordion.Control pl="0">Your Multis</Accordion.Control>
                    <Accordion.Panel>
                      <Accordion pl="0">
                        {app.multies > 0 &&
                          app.multis.map((multi, index) => (
                            <Accordion.Item value={multi.data.name} key={index}>
                              <Accordion.Control pl="0">{multi.data.name}</Accordion.Control>
                              <Accordion.Panel>
                                <List>
                                  {multi.data.subreddits
                                    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name))
                                    .map((sub) => (
                                      <List.Item key={sub.name}>
                                        <Text
                                          component="a"
                                          onClick={() => router.push(`/r/${sub.name}`)}
                                          style={{ cursor: 'pointer' }}
                                          variant="link"
                                        >
                                          {sub.name.toLowerCase()}
                                        </Text>
                                      </List.Item>
                                    ))}
                                </List>
                              </Accordion.Panel>
                            </Accordion.Item>
                          ))}
                      </Accordion>
                    </Accordion.Panel>
                  </Accordion.Item>
                </Accordion>
              </Navbar.Section>

              <Navbar.Section>
                <Group position="apart" pt="md">
                  <Text>Hello {session.user.name}</Text>
                  <img
                    alt={session.user.name}
                    height={32}
                    loading="lazy"
                    src={session.user.image}
                    width={32}
                  />
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
    </AppShell>
  );
}
