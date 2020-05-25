import Document, {Head, Main, NextScript, Html} from 'next/document'

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head />
        <body className="p-4">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
