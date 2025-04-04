'use client'

interface ReloadButtonProps {
  message?: string
}

/**
 * The reload button.
 */
export function ReloadButton({
  message = 'Whoops!'
}: Readonly<ReloadButtonProps>) {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center space-y-4 text-center">
      <p className="max-w-60 text-black dark:text-white">{message}</p>
      <div className="flex gap-4">
        <button
          className="rounded bg-blue-500 px-4 py-2 hover:cursor-pointer hover:bg-blue-600"
          onClick={() => window.location.reload()}
        >
          Reload Page
        </button>
      </div>
    </div>
  )
}
