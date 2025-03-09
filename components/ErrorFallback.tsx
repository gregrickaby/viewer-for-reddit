import { FallbackProps } from 'react-error-boundary'

/**
 * ErrorFallback component.
 *
 *  Display an error message when an error occurs in a component wrapped by the ErrorBoundary component.
 *
 * @param {FallbackProps} props - The props of the component.
 * @param {Error} props.error - The error object.
 */
export function ErrorFallback({
  error,
  resetErrorBoundary
}: Readonly<FallbackProps>) {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="mb-4 text-xl">Something went wrong:</h2>
        <pre className="mb-4 text-red-500">{error.message}</pre>
        <button
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          onClick={resetErrorBoundary}
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
