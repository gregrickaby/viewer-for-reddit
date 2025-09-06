import type {StaticImageData} from 'next/image'

declare module '*.png' {
  const src: StaticImageData
  export default src
}

declare module '*.jpg' {
  const src: StaticImageData
  export default src
}

declare module '*.jpeg' {
  const src: StaticImageData
  export default src
}

declare module '*.webp' {
  const src: StaticImageData
  export default src
}

declare module '*.gif' {
  const src: StaticImageData
  export default src
}

declare module '*.avif' {
  const src: StaticImageData
  export default src
}

declare module '*.ico' {
  const src: StaticImageData
  export default src
}

declare module '*.svg' {
  import * as React from 'react'

  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & {title?: string}
  >

  const src: string
  export default src
}

declare global {
  interface Window {
    scrollTo: (x: number, y: number) => void
    ResizeObserver: typeof ResizeObserver
    IntersectionObserver: typeof IntersectionObserver
  }
}

declare module '*.module.css' {
  const classes: {[key: string]: string}
  export default classes
}
