'use client'

import { useOptimistic, useState } from 'react'
import { vote } from '@/app/actions/things'
import { compactNumber } from '@/lib/format'
import type { Vote } from '@/lib/view-models'
import styles from './vote-buttons.module.css'
import { useEnhancedForm } from './use-enhanced-form'

type VoteState = { likes: Vote; score: number }

export type VoteButtonsProps = {
  fullname: string
  likes: Vote
  score: number
  hideScore: boolean
  /** Archived and locked things can't be voted on. */
  disabled?: boolean
  /** What is being voted on, for labels: "post" or "comment". */
  noun: string
}

/** Pressing the active arrow clears the vote; the score moves by the difference. */
export function applyVote(state: VoteState, target: 1 | -1): VoteState {
  const likes: Vote = state.likes === target ? 0 : target
  return { likes, score: state.score - state.likes + likes }
}

function targetOf(formData: FormData): 1 | -1 {
  return formData.get('target') === '-1' ? -1 : 1
}

/**
 * Upvote, score, downvote (design §8.6). The vote shows at once, is confirmed
 * in the same transition when Reddit accepts it, and rolls back with a
 * message when it doesn't. Without JS it's a plain form post.
 */
export function VoteButtons({
  fullname,
  likes,
  score,
  hideScore,
  disabled,
  noun,
}: VoteButtonsProps) {
  const [confirmed, setConfirmed] = useState<VoteState>({ likes, score })
  const [view, setView] = useOptimistic(confirmed)

  const { formProps, error } = useEnhancedForm(vote, {
    optimistic: (formData) => setView(applyVote(view, targetOf(formData))),
    settled: (result, formData) => {
      if (result.ok) setConfirmed((state) => applyVote(state, targetOf(formData)))
    },
  })

  const scoreText = hideScore ? '•' : compactNumber(view.score)
  const scoreLabel = hideScore ? 'score hidden' : `score ${view.score.toLocaleString('en')}`

  return (
    <form {...formProps} className={styles.root} data-vote={view.likes}>
      <input type="hidden" name="id" value={fullname} />
      <input type="hidden" name="current" value={view.likes} />
      <button
        type="submit"
        name="target"
        value="1"
        className={`${styles.arrow} ${styles.up}`}
        aria-pressed={view.likes === 1}
        aria-label={`Upvote ${noun}, ${scoreLabel}`}
        disabled={disabled}
      >
        <Arrow />
      </button>
      <span className={styles.score} aria-live="polite">
        {scoreText}
      </span>
      <button
        type="submit"
        name="target"
        value="-1"
        className={`${styles.arrow} ${styles.down}`}
        aria-pressed={view.likes === -1}
        aria-label={`Downvote ${noun}, ${scoreLabel}`}
        disabled={disabled}
      >
        <Arrow />
      </button>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}

function Arrow() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
      <path d="M10 3 17 11h-4v6H7v-6H3z" />
    </svg>
  )
}
