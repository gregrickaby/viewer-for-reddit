import {parse as parseYaml} from 'yaml'

/**
 * Parse frontmatter from markdown content.
 *
 * Extracts YAML frontmatter delimited by `---` markers at the start of the file
 * and returns both the parsed data and remaining content.
 *
 * @param fileContent - The raw markdown file content
 * @returns Object with frontmatter data and content
 *
 * @example
 * ```ts
 * const input = `---
 * title: My Post
 * author: Greg
 * ---
 * # Content here`
 *
 * const {data, content} = parseFrontmatter(input)
 * // data: { title: 'My Post', author: 'Greg' }
 * // content: '# Content here'
 * ```
 */
export function parseFrontmatter(fileContent: string): {
  data: Record<string, unknown>
  content: string
} {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?(?:\n|$)([\s\S]*)$/
  const match = frontmatterRegex.exec(fileContent)

  if (!match) {
    return {data: {}, content: fileContent}
  }

  const [, frontmatterText, content] = match
  const trimmedFrontmatter = frontmatterText.trim()
  const data = trimmedFrontmatter
    ? (parseYaml(trimmedFrontmatter) as Record<string, unknown>)
    : {}

  return {data, content: content.trim()}
}
