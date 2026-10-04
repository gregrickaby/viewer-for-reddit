/* eslint-disable @next/next/no-img-element -- community emoji are tiny images Reddit already serves */
import { Fragment } from 'react'
import type { FlairView } from '@/lib/view-models'
import styles from './flair-text.module.css'

/** A flair's text with its community emoji as images, where Reddit writes `:name:`. */
export function FlairText({ flair }: { flair: FlairView }) {
  return flair.parts.map((part, index) =>
    part.kind === 'text' ? (
      <Fragment key={index}>{part.text}</Fragment>
    ) : (
      <img
        key={index}
        className={styles.emoji}
        src={part.src}
        alt={part.name}
        title={part.name}
        width={16}
        height={16}
        loading="lazy"
        decoding="async"
      />
    ),
  )
}
