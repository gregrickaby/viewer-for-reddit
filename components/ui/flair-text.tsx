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
        alt={part.name}
        className={styles.emoji}
        decoding="async"
        height={16}
        key={index}
        loading="lazy"
        src={part.src}
        title={part.name}
        width={16}
      />
    ),
  )
}
