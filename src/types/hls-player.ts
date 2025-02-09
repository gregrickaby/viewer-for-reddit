/**
 * HlsPlayer component props.
 */
export interface HlsPlayerProps {
  src?: string
  fallbackUrl?: string
  poster?: string
  id: string
  dataHint?: string
  autoPlay?: boolean
  controls?: boolean
  loop?: boolean
  muted?: boolean
  playsInline?: boolean
  preload?: 'none' | 'metadata' | 'auto'
}
