export interface HlsPlayerProps
  extends Omit<React.VideoHTMLAttributes<HTMLVideoElement>, 'data-hint'> {
  dataHint?: string
  src?: string
  fallbackUrl?: string
}
