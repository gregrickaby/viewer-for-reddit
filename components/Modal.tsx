'use client'

import { IconX } from '@tabler/icons-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  /** Whether the modal is currently visible */
  isOpen: boolean
  /** Callback function when modal should close */
  onClose: () => void
  /** Modal header text */
  title: string
  /** Modal content */
  children: React.ReactNode
}

/**
 * Modal Component.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children
}: Readonly<ModalProps>) {
  // Prevent body scrolling when modal is open.
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  // Early return if modal is not open.
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-start justify-center">
      {/* Semi-transparent backdrop .*/}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />

      {/* Modal content container. */}
      <div className="relative z-50 w-full max-w-xl rounded-b-lg bg-white p-6 text-black shadow-xl dark:bg-zinc-900 dark:text-white">
        {/* Modal header with title and close button. */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            aria-label={`Close ${title} modal`}
            className="absolute top-6 right-6 hover:cursor-pointer"
            onClick={onClose}
          >
            <IconX />
          </button>
        </div>

        {/* Modal content. */}
        {children}
      </div>
    </div>,
    document.body
  )
}
