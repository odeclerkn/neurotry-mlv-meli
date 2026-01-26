'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onCancel])

  if (!isOpen || typeof window === 'undefined') return null

  const handleConfirmClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onConfirm()
  }

  const handleCancelClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onCancel()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel()
    }
  }

  const modal = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        pointerEvents: 'auto',
      }}
      onClick={handleBackdropClick}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          border: '2px solid #E5E7EB',
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '12px',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: '14px',
            color: '#4B5563',
            marginBottom: '24px',
            whiteSpace: 'pre-line',
            lineHeight: '1.5',
          }}
        >
          {message}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleCancelClick}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              backgroundColor: '#F3F4F6',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              cursor: 'pointer',
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 1000000,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#E5E7EB'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F3F4F6'
            }}
            type="button"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirmClick}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'white',
              backgroundColor: confirmVariant === 'danger' ? '#DC2626' : '#3B82F6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 1000000,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = confirmVariant === 'danger' ? '#B91C1C' : '#2563EB'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = confirmVariant === 'danger' ? '#DC2626' : '#3B82F6'
            }}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
