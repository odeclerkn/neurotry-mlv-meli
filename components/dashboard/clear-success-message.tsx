'use client'

import { useEffect } from 'react'

export function ClearSuccessMessage() {
  useEffect(() => {
    // Verificar si hay query params de éxito
    const url = new URL(window.location.href)
    const hasSuccessMessage = url.searchParams.has('meli_success') || url.searchParams.has('meli_error')

    if (hasSuccessMessage) {
      // Limpiar después de 3 segundos
      const timer = setTimeout(() => {
        // Limpiar los query params sin recargar la página
        window.history.replaceState({}, '', '/dashboard')
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [])

  return null
}
