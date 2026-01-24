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
    window.location.href = '/api/meli/connect'
  }

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('¿Estás seguro de que deseas desconectar esta cuenta?')) {
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
      }
    } catch (error) {
      console.error('Error disconnecting:', error)
      alert('Error al desconectar la cuenta')
    } finally {
      setLoading(null)
    }
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
        alert('Error al cambiar de cuenta')
      }
    } catch (error) {
      console.error('Error switching:', error)
      alert('Error al cambiar de cuenta')
    } finally {
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
        alert('Error al sincronizar productos')
      }
    } catch (error) {
      console.error('Error syncing products:', error)
      alert('Error al sincronizar productos')
    } finally {
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
                      <div className="flex items-center gap-2">
                        <span className="font-medium">ID: {connection.meli_user_id}</span>
                        {connection.is_active && (
                          <Badge variant="default" className="bg-green-500">
                            Activa
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {!connection.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSwitch(connection.id)}
                          disabled={loading === connection.id}
                        >
                          {loading === connection.id ? 'Cambiando...' : 'Activar'}
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDisconnect(connection.id)}
                        disabled={loading === connection.id}
                      >
                        {loading === connection.id ? 'Desconectando...' : 'Desconectar'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleConnect}
                  className="border-[#FFE600] text-black hover:bg-[#FFE600]/10"
                >
                  Conectar otra cuenta
                </Button>

                {activeConnection && (
                  <Button
                    onClick={handleSyncProducts}
                    disabled={loading === 'sync'}
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
