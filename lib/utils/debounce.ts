/**
 * Creates a debounced version of a function.
 *
 * @param func The function to debounce.
 * @param delay The number of milliseconds to delay.
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  delay: number
) {
  let timer: ReturnType<typeof setTimeout>

  return function (this: any, ...args: Parameters<T>): void {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func.apply(this, args)
    }, delay)
  }
}
