'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export function BackToDashboardButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isNavigating, setIsNavigating] = useState(false)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setIsNavigating(true)
    startTransition(() => {
      router.push('/dashboard')
    })
  }

  const loading = isPending || isNavigating

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className="text-primary-600 hover:text-primary-700 font-body text-sm flex items-center gap-2 transition-colors group disabled:opacity-70"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Volviendo...</span>
          </>
        ) : (
          <>
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>Volver al Dashboard</span>
          </>
        )}
      </button>

      {/* Overlay de carga global */}
      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-neutral-700 font-body">Volviendo al Dashboard...</p>
          </div>
        </div>
      )}
    </>
  )
}
