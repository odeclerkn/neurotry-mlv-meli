'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface NotificationModalProps {
  isOpen: boolean
  title: string
  message: string
  variant?: 'success' | 'error' | 'info'
  onClose: () => void
}

export function NotificationModal({
  isOpen,
  title,
  message,
  variant = 'success',
  onClose,
}: NotificationModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen || typeof window === 'undefined') return null

  const variantConfig = {
    success: {
      borderColor: '#86EFAC',
      titleColor: '#166534',
      icon: '✅',
      buttonColor: '#16A34A',
      buttonHoverColor: '#15803D',
    },
    error: {
      borderColor: '#FCA5A5',
      titleColor: '#991B1B',
      icon: '❌',
      buttonColor: '#DC2626',
      buttonHoverColor: '#B91C1C',
    },
    info: {
      borderColor: '#93C5FD',
      titleColor: '#1E40AF',
      icon: 'ℹ️',
      buttonColor: '#3B82F6',
      buttonHoverColor: '#2563EB',
    },
  }

  const config = variantConfig[variant]

  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
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
          border: `2px solid ${config.borderColor}`,
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
          <span style={{ fontSize: '32px' }}>{config.icon}</span>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: config.titleColor,
                marginBottom: '8px',
              }}
            >
              {title}
            </h3>
            <p
              style={{
                fontSize: '14px',
                color: '#4B5563',
                whiteSpace: 'pre-line',
                lineHeight: '1.5',
              }}
            >
              {message}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleCloseClick}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'white',
              backgroundColor: config.buttonColor,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 1000000,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = config.buttonHoverColor
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = config.buttonColor
            }}
            type="button"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
