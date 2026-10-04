'use client'

import { useEffect, useRef, useState } from 'react'

const HERO = 'gallery-hero'

/** The lightbox's images load only while it is open, from their `data-src` and `data-srcset`. */
function loadImages(dialog: HTMLDialogElement) {
  for (const image of dialog.querySelectorAll<HTMLImageElement>('img[data-src]')) {
    if (image.dataset.srcset) image.srcset = image.dataset.srcset
    image.src = image.dataset.src!
  }
}

/** Drops them again, so a closed lightbox doesn't keep full-size images decoded. */
function releaseImages(dialog: HTMLDialogElement) {
  for (const image of dialog.querySelectorAll<HTMLImageElement>('img[data-src]')) {
    image.removeAttribute('srcset')
    image.removeAttribute('src')
  }
}

/**
 * Morphs `from` into `to` while `update` swaps the page (design §8.10), or
 * just runs `update` without View Transitions or under reduced motion.
 */
function morph(from: HTMLElement | null, to: HTMLElement | null, update: () => void) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || reduced || !from || !to) {
    update()
    return
  }
  from.style.viewTransitionName = HERO
  const transition = document.startViewTransition(() => {
    from.style.viewTransitionName = ''
    to.style.viewTransitionName = HERO
    update()
  })
  void transition.finished
    .catch(() => {})
    .finally(() => {
      to.style.viewTransitionName = ''
    })
}

/**
 * Opens a gallery's server-rendered `<dialog>` at the tapped image, with a
 * morph, ←/→ keys, and an "Image i of n" announcement; closing returns focus
 * to the image that opened it and unloads the full-size images. Without JavaScript, each image is a link to
 * its full-size original instead.
 */
export function GalleryLightbox({ postId }: { postId: string }) {
  const liveRef = useRef<HTMLParagraphElement>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const section = liveRef.current?.closest<HTMLElement>('[data-gallery]')
    const dialog = section?.querySelector('dialog')
    const track = dialog?.querySelector<HTMLElement>('ul')
    if (!section || !dialog || !track) return

    let origin: HTMLAnchorElement | null = null
    const slides = () => [...track.querySelectorAll<HTMLElement>('li[data-index]')]
    const announce = (position: number) => setMessage(`Image ${position + 1} of ${slides().length}`)

    function onClick(event: MouseEvent) {
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[data-index]')
      if (!link || !section!.contains(link) || dialog!.contains(link)) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
      event.preventDefault()
      origin = link
      const target = slides().find((slide) => slide.dataset.index === link.dataset.index)
      loadImages(dialog!)
      morph(link.querySelector('img'), target?.querySelector('img') ?? null, () => {
        dialog!.showModal()
        if (target) track!.scrollTo({ left: target.offsetLeft, behavior: 'instant' })
        announce(target ? slides().indexOf(target) : 0)
      })
    }

    function onKey(event: KeyboardEvent) {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
      event.preventDefault()
      track!.scrollBy({ left: (event.key === 'ArrowRight' ? 1 : -1) * track!.clientWidth })
    }

    function onScrollEnd() {
      announce(Math.round(track!.scrollLeft / Math.max(track!.clientWidth, 1)))
    }

    function onClose() {
      releaseImages(dialog!)
      origin?.focus()
    }

    section.addEventListener('click', onClick)
    dialog.addEventListener('keydown', onKey)
    dialog.addEventListener('close', onClose)
    track.addEventListener('scrollend', onScrollEnd)
    return () => {
      section.removeEventListener('click', onClick)
      dialog.removeEventListener('keydown', onKey)
      dialog.removeEventListener('close', onClose)
      track.removeEventListener('scrollend', onScrollEnd)
      // Also runs when Activity hides the route: don't leave a modal open behind it.
      if (dialog.open) dialog.close()
      releaseImages(dialog)
    }
  }, [postId])

  return (
    <p ref={liveRef} className="visually-hidden" aria-live="polite">
      {message}
    </p>
  )
}
