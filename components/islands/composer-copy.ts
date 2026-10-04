/* Copy shared by the composer island and its server-rendered form (`ComposerForm`). */

export const COMMENT_MAX_CHARS = 10_000

export const REPLY_HINT = 'Markdown supported · ⌘/Ctrl+Enter to send'
export const EDIT_HINT = '⌘/Ctrl+Enter to save'

export function placeholderFor(parent: string): string {
  return parent.startsWith('t3_') ? 'What are your thoughts?' : 'Write a reply…'
}
