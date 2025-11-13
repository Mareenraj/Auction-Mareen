'use client'
import React from "react"

interface DeleteConfirmationProps {
  isOpen: boolean
  title?: string
  message?: string
  onConfirm: () => void
  onCancel: () => void
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  isOpen,
  title = "Confirm Delete",
  message = "Are you sure you want to delete this item?",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-xl p-6 shadow-lg max-w-sm w-full text-center">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-gray-600 mb-4">{message}</p>

        <div className="flex justify-center gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmation
