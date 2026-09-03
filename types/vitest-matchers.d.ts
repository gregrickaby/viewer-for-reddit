/**
 * Vitest 5 renamed the augmentable interface from `Assertion<T>` to
 * `Matchers<R, T>` and stopped reading `jest.Matchers`. `@testing-library/jest-dom`
 * (7.0.1) and `@types/jest-axe` (3.5.9) still only augment the old
 * `Assertion<T>` / `jest.Matchers` shapes, so their matcher types silently
 * disappear under Vitest 5. Re-declare them here against the interface
 * Vitest 5 actually reads.
 */
import type {TestingLibraryMatchers} from '@testing-library/jest-dom/matchers'

declare module 'vitest' {
  interface Matchers<R, T> extends TestingLibraryMatchers<T, R> {
    toHaveNoViolations: () => R
  }
}
