// Modal container for global modal management
'use client'

import { useEffect } from 'react'
import { useDataStore } from '@/stores'

export function ModalContainer() {
  const { modals, hideModal } = useDataStore()

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && modals.length > 0) {
        hideModal(modals[modals.length - 1].id)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [modals, hideModal])

  if (modals.length === 0) {
    return null
  }

  return (
    <>
      {modals.map((modal) => (
        <div
          key={modal.id}
          className="fixed inset-0 z-50 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          {/* Background overlay */}
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              aria-hidden="true"
              onClick={() => hideModal(modal.id)}
            />

            {/* Modal panel */}
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-[#252525] border border-[#333] rounded-3xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-[#e5e7eb]">
                  {modal.title}
                </h3>
                <button
                  onClick={() => hideModal(modal.id)}
                  className="text-[#555] hover:text-[#9ca3af] focus:outline-none"
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="mb-6">
                {modal.content}
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => hideModal(modal.id)}
                  className="px-4 py-2 text-sm font-medium text-[#e5e7eb] bg-[#2e2e2e] border border-[#3a3a3a] rounded-xl hover:bg-[#363636] focus:outline-none transition-colors"
                >
                  {modal.cancelText || 'Cancel'}
                </button>
                {modal.onConfirm && (
                  <button
                    onClick={() => {
                      modal.onConfirm?.()
                      hideModal(modal.id)
                    }}
                    className="px-4 py-2 text-sm font-medium text-[#1f1f1f] bg-[#b0c4b1] border border-transparent rounded-xl hover:bg-[#c4d5c5] focus:outline-none transition-colors"
                  >
                    {modal.confirmText || 'Confirm'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

function XMarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}