import Link from 'next/link'
import NotFound from '@/components/NoResults'
import SiteHead from '@/components/SiteHead'

export default function FourOhFour() {
  return (
    <>
      <SiteHead />
      <main className="main wrap text-center">
        <NotFound />
        <Link href="/">
          <a>&larr; Go home</a>
        </Link>
      </main>
    </>
  )
}
