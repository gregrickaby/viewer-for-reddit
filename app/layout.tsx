import '@/app/globals.css'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Search from '@/components/Search'
import config from '@/lib/config'
import type {Metadata} from 'next'

/**
 * Generate default site metadata.
 */
export const metadata: Metadata = {
  title: config.siteName,
  description: config.metaDescription
}

/**
 * The root layout.
 */
export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <Search />
        <main className="main">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
