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
