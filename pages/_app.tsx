import { ColorScheme, ColorSchemeProvider, MantineProvider } from '@mantine/core';
import { useColorScheme, useHotkeys } from '@mantine/hooks';
import { SessionProvider } from 'next-auth/react';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { useState } from 'react';
import RedditProvider from '~/components/RedditProvider';
import config from '~/lib/config';

export default function App(props: AppProps) {
  const {
    Component,
    pageProps: { session, ...pageProps },
  } = props;

  // Detect user's preferred color scheme.
  const preferredColorScheme = useColorScheme();

  // Set the color scheme for the app.
  const [colorScheme, setColorScheme] = useState<ColorScheme>(preferredColorScheme);

  // Color scheme toggler.
  const toggleColorScheme = (value?: ColorScheme) =>
    setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));

  // Bind key combination to color scheme toggle.
  useHotkeys([['mod+J', () => toggleColorScheme()]]);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />

        <title>{config?.siteTitle}</title>
        <meta name="description" content={config?.siteDescription} />

        <link rel="preconnect" href="//www.reddit.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="//oauth.reddit.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="//i.redd.it" crossOrigin="anonymous" />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon/icon.png" />
        <link rel="icon" href="/favicon/icon.png" sizes="192x192" />

        <meta property="og:type" content="website" />
        <meta property="og:url" content={config?.siteUrl} />
        <meta property="og:title" content={config?.siteTitle} />
        <meta property="og:description" content={config?.siteDescription} />
        <meta property="og:image" content={`${config?.siteUrl}social-share.jpg`} />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={config?.siteUrl} />
        <meta property="twitter:title" content={config?.siteTitle} />
        <meta property="twitter:description" content={config?.siteDescription} />
        <meta property="twitter:image" content={`${config?.siteUrl}social-share.jpg`} />

        <meta
          name="google-site-verification"
          content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION}
        />
      </Head>
      <SessionProvider session={session}>
        <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
          <MantineProvider theme={{ colorScheme }} withGlobalStyles withNormalizeCSS>
            <RedditProvider>
              <Component {...pageProps} />
            </RedditProvider>
          </MantineProvider>
        </ColorSchemeProvider>
      </SessionProvider>
    </>
  );
}
