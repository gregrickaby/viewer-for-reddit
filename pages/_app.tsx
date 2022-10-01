import type {AppProps} from 'next/app'
import '~/styles/index.css'

/**
 * App component.
 */
export default function App({Component, pageProps}: AppProps) {
  return <Component {...pageProps} />
}
