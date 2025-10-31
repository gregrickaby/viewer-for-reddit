import {Text} from '@mantine/core'
import Link from 'next/link'
import classes from './CommentAuthor.module.css'

/**
 * Props for the CommentAuthor component.
 */
interface CommentAuthorProps {
  /** The username of the comment author */
  author: string | undefined
}

/**
 * Renders the comment author's username with appropriate styling and linking.
 *
 * Features:
 * - Links to user profile for active accounts
 * - Displays plain text for deleted/removed accounts
 * - Handles undefined/missing author gracefully
 * - Applies consistent styling for dimmed appearance
 *
 * @param {CommentAuthorProps} props - Component props
 * @returns JSX.Element author name with optional link
 */
export function CommentAuthor({author}: Readonly<CommentAuthorProps>) {
  const isDeletedOrRemoved = ['[deleted]', '[removed]'].includes(author || '')

  if (!author || isDeletedOrRemoved) {
    return (
      <Text c="dimmed" size="sm" fw={700}>
        u/{author || '[deleted]'}
      </Text>
    )
  }

  return (
    <Link className={classes.link} href={`/u/${author}`}>
      <Text c="dimmed" size="sm" fw={700}>
        u/{author}
      </Text>
    </Link>
  )
}
