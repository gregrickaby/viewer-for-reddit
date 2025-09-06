export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends (...args: unknown[]) => unknown
    ? T[K]
    : T[K] extends Array<infer U>
      ? Array<DeepPartial<U>>
      : T[K] extends object
        ? DeepPartial<T[K]>
        : T[K]
}
