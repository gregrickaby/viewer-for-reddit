import AppIcon from '@/app/icon.png'
import {AppLink} from '@/components/ui/AppLink/AppLink'
import {appConfig} from '@/lib/config/app.config'
import {Button, Card, Container, Group, Stack, Text, Title} from '@mantine/core'
import {IconBrandReddit} from '@tabler/icons-react'
import Image from 'next/image'

/** Landing page for unauthenticated users. Explains why login is required. */
export function LandingPage() {
  return (
    <Container size="sm" py="xl">
      <Card withBorder padding="xl" radius="md">
        <Stack align="center" gap="lg">
          <Image
            alt="Reddit Viewer Logo"
            height={64}
            priority
            src={AppIcon}
            width={64}
          />

          <Title order={1} ta="center">
            {appConfig.site.name}
          </Title>

          <Text size="lg" c="dimmed" ta="center">
            {appConfig.site.description}
          </Text>

          <Text ta="center" maw={440}>
            Reddit requires authentication to access content. Sign in to browse
            posts, save favorites, and customize your feed. Don't have an
            account?{' '}
            <AppLink
              href="https://www.reddit.com/register/"
              style={{textDecoration: 'underline'}}
            >
              Sign up now
            </AppLink>
            .
          </Text>

          <Group gap="md" mt="md">
            <Button
              aria-label="Sign in with Reddit"
              color="red"
              component="a"
              href="/api/auth/login"
              leftSection={<IconBrandReddit size={16} />}
              size="lg"
              variant="filled"
            >
              Sign in with Reddit
            </Button>
          </Group>

          <AppLink
            href="/about"
            style={{color: 'var(--mantine-color-dimmed)', fontSize: '0.875rem'}}
          >
            Learn more
          </AppLink>
        </Stack>
      </Card>
    </Container>
  )
}
