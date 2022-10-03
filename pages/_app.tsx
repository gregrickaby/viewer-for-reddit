import {AppProps} from 'next/app'
import {MantineProvider} from '@mantine/core'
import RedditProvider from '~/components/RedditProvider'

/**
 * App component.
 */
export default function App(props: AppProps) {
  const {Component, pageProps} = props

  return (
    <MantineProvider
      withGlobalStyles
      withNormalizeCSS
      theme={{
        colorScheme: 'dark'
      }}
    >
      <RedditProvider>
        <Component {...pageProps} />
      </RedditProvider>
    </MantineProvider>
  )
}
