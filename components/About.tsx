import { IconGithub } from '@/icons/Github'
import Image from 'next/image'

/**
 * About component.
 */
export default function About() {
  return (
    <div className="flex flex-col gap-6">
      <p>It&apos;s the ultimate Reddit app!</p>
      <p>
        Inspired by short-form content, this app redefines what Reddit could be
        with a mobile-friendly, TikTok-style layout—letting you effortlessly
        scroll through posts, watch videos, and explore threads in a fast,
        engaging flow.
      </p>

      <p>
        With a focus on privacy, there&apos;s no tracking or logging of your
        activity. No ads, no cookies, no analytics, no data collection.
      </p>

      <p className="flex items-center gap-2">
        Enjoying the app?{' '}
        <a
          aria-label="buy the author a coffee"
          className="flex items-center gap-1 font-bold underline"
          href="https://www.buymeacoffee.com/gregrickaby"
          rel="noopener noreferrer"
          target="_blank"
        >
          Buy me a coffee!
          <Image
            alt="buy me a coffe"
            height="16"
            src="/buymeacoffee.png"
            width="16"
          />
        </a>
      </p>

      <footer className="flex flex-col items-center gap-4 border-t pt-4 lg:flex-row lg:justify-between">
        <p>
          Made with ❤️ by{' '}
          <a
            aria-label="visit the author's website"
            className="underline"
            href="https://gregrickaby.com"
            rel="author noopener noreferrer"
            target="_blank"
          >
            Greg Rickaby
          </a>
        </p>
        <p>
          <a
            aria-label="view source code on github"
            className="flex items-center gap-1 underline"
            href="https://github.com/gregrickaby/viewer-for-reddit"
            rel="noopener noreferrer"
            target="_blank"
          >
            <IconGithub />
            View the source code
          </a>
        </p>
      </footer>
    </div>
  )
}
