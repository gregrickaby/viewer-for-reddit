import AppIcon from '@/app/icon.png'
import {AppLink} from '@/components/ui/AppLink/AppLink'
import {appConfig} from '@/lib/config/app.config'
import {Button, Card, Container, Group, Stack, Text, Title} from '@mantine/core'
import {
  IconBrandReddit,
  IconShield,
  IconChartBar,
  IconLayoutDashboard,
  IconUserCheck,
  IconLock,
  IconBrandGithub
} from '@tabler/icons-react'
import Image from 'next/image'
import Script from 'next/script'

/** Landing page for unauthenticated users - markets the application. */
export function LandingPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: appConfig.site.name,
    description: appConfig.site.metaDescription,
    url: appConfig.site.baseUrl,
    applicationCategory: 'SocialNetworkingApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock'
    },
    author: {
      '@type': 'Person',
      name: appConfig.author.name,
      url: appConfig.author.url
    },
    featureList: [
      'Ad-free Reddit browsing',
      'Chronological feed (no algorithm)',
      'Multi-subreddit views (multireddits)',
      'Secure Reddit OAuth sign-in',
      'Dark/light mode support',
      'Responsive mobile-first design'
    ],
    screenshot: `${appConfig.site.baseUrl}/social-share.webp`,
    datePublished: '2024-01-01',
    publisher: {
      '@type': 'Organization',
      name: appConfig.author.name,
      url: appConfig.author.url
    }
  }

  const features = [
    {
      icon: IconShield,
      title: 'No Ads',
      description:
        "Every post you see is real. We don't sell space to advertisers."
    },
    {
      icon: IconChartBar,
      title: 'No Algorithms',
      description:
        'Posts show up in the order they were posted, not the order that keeps you scrolling.'
    },
    {
      icon: IconLayoutDashboard,
      title: 'Multireddits',
      description: 'Mix your favorite subreddits into one custom feed.'
    },
    {
      icon: IconUserCheck,
      title: 'Your Account',
      description:
        "Sign in and you'll see your subscriptions, saved posts, and votes, just like reddit.com."
    },
    {
      icon: IconLock,
      title: 'Secure Sign-in',
      description:
        "We use Reddit's own login. Your password never touches our servers."
    },
    {
      icon: IconBrandGithub,
      title: 'Open Source',
      description:
        "The code's on GitHub. Fork it, self-host it, or send a pull request."
    }
  ]

  return (
    <>
      <Script
        id="landing-page-schema"
        data-testid="landing-page-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(structuredData)}}
      />
      <Container size="sm" py="xl">
        <section aria-labelledby="hero-heading" style={{marginBottom: '4rem'}}>
          <Stack align="center" gap="lg">
            <Image
              alt={`${appConfig.site.name} Logo`}
              height={80}
              priority
              src={AppIcon}
              width={80}
            />

            <Title
              order={1}
              id="hero-heading"
              ta="center"
              style={{fontSize: 'clamp(2rem, 5vw, 3rem)'}}
            >
              {appConfig.site.name}
            </Title>

            <Text size="lg" c="dimmed" ta="center" maw={600}>
              {appConfig.site.metaDescription}
            </Text>

            <Group gap="md" mt="md" justify="center">
              <Button
                aria-label="Sign in with Reddit"
                color="red"
                component="a"
                href="/api/auth/login"
                rel="nofollow"
                leftSection={<IconBrandReddit size={20} />}
                size="lg"
                variant="filled"
              >
                Sign in with Reddit
              </Button>
              <Button component="a" href="/about" size="lg" variant="outline">
                Learn More
              </Button>
            </Group>

            <Text ta="center" c="dimmed" size="sm">
              Don't have a Reddit account?{' '}
              <AppLink
                href="https://www.reddit.com/register/"
                style={{textDecoration: 'underline'}}
              >
                Sign up on Reddit
              </AppLink>
            </Text>
          </Stack>
        </section>

        <section
          aria-labelledby="features-heading"
          style={{marginBottom: '4rem'}}
        >
          <Title order={2} id="features-heading" ta="center" mb="xl">
            Why {appConfig.site.name}?
          </Title>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem'
            }}
          >
            {features.map((feature, index) => (
              <Card
                key={index}
                withBorder
                padding="lg"
                radius="md"
                style={{height: '100%'}}
              >
                <Stack align="center" gap="md">
                  <feature.icon size={32} color="red" aria-hidden="true" />
                  <Title order={3} ta="center">
                    {feature.title}
                  </Title>
                  <Text c="dimmed" ta="center" size="sm">
                    {feature.description}
                  </Text>
                </Stack>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="cta-heading">
          <Card withBorder padding="xl" radius="md">
            <Stack align="center" gap="md">
              <Title order={2} id="cta-heading" ta="center">
                Ready to browse without ads?
              </Title>
              <Text c="dimmed" ta="center" maw={500}>
                Thousands of people already use it daily.
              </Text>
              <Button
                color="red"
                component="a"
                href="/api/auth/login"
                rel="nofollow"
                leftSection={<IconBrandReddit size={16} />}
                size="lg"
                variant="filled"
              >
                Get Started Free
              </Button>
              <Text size="sm" c="dimmed">
                <AppLink
                  href={appConfig.links.github}
                  style={{textDecoration: 'underline'}}
                >
                  View on GitHub
                </AppLink>{' '}
                •{' '}
                <AppLink href="/about" style={{textDecoration: 'underline'}}>
                  Read the docs
                </AppLink>
              </Text>
            </Stack>
          </Card>
        </section>
      </Container>
    </>
  )
}
