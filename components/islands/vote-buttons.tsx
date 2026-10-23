'use client'

import { useOptimistic, useState } from 'react'

import { vote } from '@/app/actions/things'
import { compactNumber } from '@/lib/format'
import type { Vote } from '@/lib/view-models'

import { useEnhancedForm } from './use-enhanced-form'
import styles from './vote-buttons.module.css'

interface VoteState {
  likes: Vote
  score: number
}

export interface VoteButtonsProps {
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
 * Upvote, score, downvote. The vote shows at once, is confirmed
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
      <input name="id" type="hidden" value={fullname} />
      <input name="current" type="hidden" value={view.likes} />
      <button
        aria-label={`Upvote ${noun}, ${scoreLabel}`}
        aria-pressed={view.likes === 1}
        className={`${styles.arrow} ${styles.up}`}
        disabled={disabled}
        name="target"
        type="submit"
        value="1"
      >
        <Arrow />
      </button>
      <span aria-live="polite" className={styles.score}>
        {scoreText}
      </span>
      <button
        aria-label={`Downvote ${noun}, ${scoreLabel}`}
        aria-pressed={view.likes === -1}
        className={`${styles.arrow} ${styles.down}`}
        disabled={disabled}
        name="target"
        type="submit"
        value="-1"
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
    <svg aria-hidden="true" focusable="false" height="20" viewBox="0 0 20 20" width="20">
      <path d="M10 3 17 11h-4v6H7v-6H3z" />
    </svg>
  )
}
