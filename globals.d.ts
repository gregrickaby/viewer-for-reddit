type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends (...args: unknown[]) => unknown
    ? T[K]
    : T[K] extends Array<infer U>
      ? Array<DeepPartial<U>>
      : T[K] extends object
        ? DeepPartial<T[K]>
        : T[K]
}

declare global {
  interface Window {
    scrollTo: (x: number, y: number) => void
    ResizeObserver: typeof ResizeObserver
    IntersectionObserver: typeof IntersectionObserver
  }
}
