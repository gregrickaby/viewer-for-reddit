/**
 * Structured data as a script tag. React writes the JSON as text, so this needs
 * no raw HTML; escaping `<` means no value could close the tag early.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json">{JSON.stringify(data).replace(/</g, '\\u003c')}</script>
}
