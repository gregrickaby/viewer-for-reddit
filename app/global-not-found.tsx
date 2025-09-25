import {NotFoundClient} from '@/components/NotFoundClient/NotFoundClient'
import type {Metadata} from 'next'
import {headers} from 'next/headers'

export const metadata: Metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for does not exist.',
  robots: {
    index: false,
    follow: false
  }
}

/**
 * The Global 404 component.
 */
export default async function GlobalNotFound() {
  const headersList = await headers()
  const serverHeaders: Record<string, string | null> = {
    referer: headersList.get('referer'),
    userAgent: headersList.get('user-agent'),
    host: headersList.get('host'),
    xForwardedFor: headersList.get('x-forwarded-for'),
    xRealIp: headersList.get('x-real-ip'),
    acceptLanguage: headersList.get('accept-language'),
    accept: headersList.get('accept'),
    connection: headersList.get('connection'),
    upgradeInsecureRequests: headersList.get('upgrade-insecure-requests'),
    secFetchSite: headersList.get('sec-fetch-site'),
    secFetchMode: headersList.get('sec-fetch-mode'),
    secFetchDest: headersList.get('sec-fetch-dest'),
    purpose: headersList.get('purpose'),
    nextUrl: headersList.get('next-url'),
    xMiddlewareNext: headersList.get('x-middleware-next'),
    xInvokePath: headersList.get('x-invoke-path'),
    xInvokeRoute: headersList.get('x-invoke-route'),
    xMatchedPath: headersList.get('x-matched-path'),
    xRoutePath: headersList.get('x-route-path'),
    pathname: headersList.get('x-pathname') || headersList.get('pathname')
  }

  return <NotFoundClient serverHeaders={serverHeaders} />
}
