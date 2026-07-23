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
  IconEye,
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
      'No tracking or analytics',
      'Chronological feed (no algorithm)',
      'Multi-subreddit views (multireddits)',
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
        'Browse Reddit completely free of advertisements and promoted content.'
    },
    {
      icon: IconEye,
      title: 'No Tracking',
      description:
        'Zero analytics, no fingerprinting, and no data collection whatsoever.'
    },
    {
      icon: IconChartBar,
      title: 'No Algorithms',
      description:
        'See posts in chronological order - no engagement-based ranking.'
    },
    {
      icon: IconLayoutDashboard,
      title: 'Multireddits',
      description: 'Combine multiple subreddits into custom feeds you control.'
    },
    {
      icon: IconUserCheck,
      title: 'Your Account',
      description:
        'Sign in with Reddit to access your subscriptions and saved posts.'
    },
    {
      icon: IconBrandGithub,
      title: 'Open Source',
      description:
        'Built transparently on GitHub. Contribute or self-host freely.'
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
              alt="Reddit Viewer Logo"
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

            <Group gap="md" mt="md">
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
            Why Reddit Viewer?
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
                Ready for a better Reddit?
              </Title>
              <Text c="dimmed" ta="center" maw={500}>
                Join thousands of users enjoying a cleaner, faster, and more
                private Reddit experience.
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
