import {createGetInitialProps} from '@mantine/next'
import Document, {Head, Html, Main, NextScript} from 'next/document'

// Mantine uses Next.js getInitialProps to load styles on server side.
const getInitialProps = createGetInitialProps()

/**
 * Custom document component.
 */
export default class _Document extends Document {
  static getInitialProps = getInitialProps

  render() {
    return (
      <Html lang="en">
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
