'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

interface MeliConnection {
  id: string
  meli_user_id: string
  is_active: boolean
  status: 'connected' | 'disconnected'
  created_at: string
}

interface MeliConnectButtonProps {
  connections: MeliConnection[]
}

export function MeliConnectButton({ connections }: MeliConnectButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const activeConnection = connections.find(c => c.is_active)

  const handleConnect = () => {
    // Redirigir directo a conectar
    window.location.href = '/api/meli/connect'
  }

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('¿Desconectar esta cuenta? Se invalidarán los tokens pero se mantendrán los datos y publicaciones.')) {
      return
    }

    setLoading(connectionId)

    try {
      const response = await fetch('/api/meli/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ connectionId })
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Error al desconectar la cuenta')
        setLoading(null)
      }
    } catch (error) {
      console.error('Error disconnecting:', error)
      alert('Error al desconectar la cuenta')
      setLoading(null)
    }
  }

  const handleDelete = async (connectionId: string) => {
    if (!confirm('⚠️ ¿Eliminar completamente esta cuenta? Se borrarán todos los datos y publicaciones. Esta acción no se puede deshacer.')) {
      return
    }

    setLoading(`delete-${connectionId}`)

    try {
      const response = await fetch('/api/meli/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ connectionId })
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Error al eliminar la cuenta')
        setLoading(null)
      }
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Error al eliminar la cuenta')
      setLoading(null)
    }
  }

  const handleReconnect = () => {
    // Reconectar directo
    window.location.href = '/api/meli/connect'
  }

  const handleSwitch = async (connectionId: string) => {
    setLoading(connectionId)

    try {
      const response = await fetch('/api/meli/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ connectionId })
      })

      if (response.ok) {
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Error al cambiar de cuenta')
        setLoading(null)
      }
    } catch (error) {
      console.error('Error switching:', error)
      alert('Error al cambiar de cuenta')
      setLoading(null)
    }
  }

  const handleSyncProducts = async () => {
    if (!activeConnection) {
      alert('No hay cuenta activa')
      return
    }

    setLoading('sync')

    try {
      const response = await fetch('/api/meli/sync-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ connectionId: activeConnection.id })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Sincronizados ${data.count} productos correctamente`)
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Error al sincronizar productos')
        setLoading(null)
      }
    } catch (error) {
      console.error('Error syncing products:', error)
      alert('Error al sincronizar productos')
      setLoading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conexión con MercadoLibre</CardTitle>
        <CardDescription>
          Conecta tu cuenta de MercadoLibre para sincronizar tus productos
        </CardDescription>
        {connections.length > 0 && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800">
            💡 <strong>Tip:</strong> Para conectar una cuenta diferente a la que ya tienes logueada en MercadoLibre,{' '}
            <a
              href="https://www.mercadolibre.com.ar/logout"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold hover:text-blue-900"
            >
              cierra sesión en MELI primero
            </a>
            {' '}y luego haz click en conectar.
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {connections.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-600 mb-4">
                No tienes ninguna cuenta de MercadoLibre conectada
              </p>
              <Button onClick={handleConnect} className="bg-[#FFE600] text-black hover:bg-[#FFE600]/90">
                Conectar con MercadoLibre
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {connections.map(connection => (
                  <div
                    key={connection.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">ID: {connection.meli_user_id}</span>
                          {connection.is_active && (
                            <Badge variant="default" className="bg-blue-500">
                              Activa
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          {connection.status === 'connected' ? (
                            <Badge variant="default" className="bg-green-500">
                              ✓ Conectada
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-400">
                              ○ Desconectada
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {connection.status === 'connected' ? (
                        <>
                          {!connection.is_active && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSwitch(connection.id)}
                              disabled={loading === connection.id}
                            >
                              {loading === connection.id ? 'Activando...' : 'Activar'}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnect(connection.id)}
                            disabled={loading === connection.id}
                          >
                            {loading === connection.id ? 'Desconectando...' : 'Desconectar'}
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleReconnect}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Reconectar
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(connection.id)}
                        disabled={loading === `delete-${connection.id}`}
                      >
                        {loading === `delete-${connection.id}` ? 'Eliminando...' : 'Eliminar'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t space-y-3">
                <Button
                  onClick={handleConnect}
                  className="w-full bg-[#FFE600] text-black hover:bg-[#FFE600]/90"
                >
                  Conectar otra cuenta de MercadoLibre
                </Button>

                {activeConnection && activeConnection.status === 'connected' && (
                  <Button
                    onClick={handleSyncProducts}
                    disabled={loading === 'sync'}
                    className="w-full"
                  >
                    {loading === 'sync' ? 'Sincronizando...' : 'Sincronizar productos'}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
