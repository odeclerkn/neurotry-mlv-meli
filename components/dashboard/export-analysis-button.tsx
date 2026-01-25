'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function ExportAnalysisButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    console.log('🔵 handleExport llamado')
    setLoading(true)
    setError(null)

    try {
      console.log('🔵 Fetching /api/meli/export-analysis')
      const response = await fetch('/api/meli/export-analysis')
      console.log('🔵 Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('🔴 Error response:', errorData)
        throw new Error(errorData.error || 'Error al exportar')
      }

      // Descargar el archivo
      console.log('🔵 Descargando archivo...')
      const blob = await response.blob()
      console.log('🔵 Blob size:', blob.size)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analisis_publicaciones_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      console.log('🟢 Archivo descargado exitosamente')
    } catch (err) {
      console.error('🔴 Error exportando:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Button
        onClick={handleExport}
        disabled={loading}
        className="bg-success hover:bg-success/90 text-white font-sans font-semibold"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Generando Excel...
          </>
        ) : (
          <>
            📥 Exportar Análisis a Excel
          </>
        )}
      </Button>

      {error && (
        <Alert variant="error" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
