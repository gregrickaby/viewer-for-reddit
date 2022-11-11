import {ColorScheme, ColorSchemeProvider, MantineProvider} from '@mantine/core'
import {useColorScheme, useHotkeys, useLocalStorage} from '@mantine/hooks'
import {AppProps} from 'next/app'
import RedditProvider from '~/components/RedditProvider'

/**
 * Custom App component.
 */
export default function App({Component, pageProps}: AppProps) {
  const preferredColorScheme = useColorScheme()
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: 'riv-color-scheme',
    defaultValue: preferredColorScheme,
    getInitialValueInEffect: true
  })

  function toggleColorScheme(value?: ColorScheme) {
    setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'))
  }

  useHotkeys([['mod+j', () => toggleColorScheme()]])

  return (
    <ColorSchemeProvider
      colorScheme={colorScheme}
      toggleColorScheme={toggleColorScheme}
    >
      <MantineProvider
        theme={{
          colorScheme,
          primaryColor: colorScheme === 'dark' ? 'gray' : 'dark'
        }}
        withGlobalStyles
        withNormalizeCSS
      >
        <RedditProvider>
          <Component {...pageProps} />
        </RedditProvider>
      </MantineProvider>
    </ColorSchemeProvider>
  )
}
