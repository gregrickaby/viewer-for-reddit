import { IconGithub } from '../icons/Github'

/**
 * About component.
 */
export default function About() {
  return (
    <>
      <div className="flex flex-col gap-6 text-white/90">
        <p>
          The Ultimate Mobile Reddit App: Dynamic, TikTok-Style, Fast &
          Tracking-Free!
        </p>
        <p>
          Inspired by short-form content, this app redefines what Reddit could
          be with a mobile-friendly, TikTok-style layout—letting you
          effortlessly scroll through posts, watch videos, and explore threads
          in a fast, engaging flow.
        </p>

        <p>
          With a focus on privacy, there's no tracking or logging of your
          activity. No ads, no cookies, no analytics, no data collection.
        </p>

        <div className="flex items-center gap-2 border-t border-white/10 pt-4">
          &copy; 2000-{new Date().getFullYear()}
          <a
            className="underline hover:no-underline"
            aria-label="visit the author's website"
            href="https://gregrickaby.com"
            rel="author"
          >
            Greg Rickaby
          </a>
          <a
            className="ml-auto"
            aria-label="view source code on github"
            href="https://github.com/gregrickaby/viewer-for-reddit"
            rel="noopener noreferrer"
            target="_blank"
          >
            <IconGithub />
          </a>
        </div>
      </div>
    </>
  )
}
