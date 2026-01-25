'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface MeliConnection {
  id: string
  meli_user_id: string
  is_active: boolean
  status: 'connected' | 'disconnected'
  meli_nickname?: string | null
  meli_email?: string | null
  meli_first_name?: string | null
  meli_last_name?: string | null
  created_at: string
}

interface MeliConnectButtonProps {
  connections: MeliConnection[]
}

export function MeliConnectButton({ connections }: MeliConnectButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null)

  const activeConnection = connections.find(c => c.is_active)

  const handleConnect = () => {
    // Redirigir directo a conectar
    window.location.href = '/api/meli/connect'
  }

  const openDisconnectDialog = (connectionId: string) => {
    setSelectedConnectionId(connectionId)
    setDisconnectDialogOpen(true)
  }

  const handleDisconnect = async () => {
    if (!selectedConnectionId) return

    setLoading(selectedConnectionId)
    setErrorMessage(null)
    setDisconnectDialogOpen(false)

    try {
      const response = await fetch('/api/meli/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ connectionId: selectedConnectionId })
      })

      if (response.ok) {
        // Redirigir a URL limpia sin query params
        window.location.href = '/dashboard'
      } else {
        setErrorMessage('Neurotry: Error al desconectar la cuenta de MercadoLibre')
        setLoading(null)
      }
    } catch (error) {
      console.error('Error disconnecting:', error)
      setErrorMessage('Neurotry: Error al desconectar la cuenta de MercadoLibre')
      setLoading(null)
    }
  }

  const openDeleteDialog = (connectionId: string) => {
    setSelectedConnectionId(connectionId)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedConnectionId) return

    setLoading(`delete-${selectedConnectionId}`)
    setErrorMessage(null)
    setDeleteDialogOpen(false)

    try {
      const response = await fetch('/api/meli/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ connectionId: selectedConnectionId })
      })

      if (response.ok) {
        // Redirigir a URL limpia sin query params
        window.location.href = '/dashboard'
      } else {
        setErrorMessage('Neurotry: Error al eliminar la cuenta de MercadoLibre')
        setLoading(null)
      }
    } catch (error) {
      console.error('Error deleting:', error)
      setErrorMessage('Neurotry: Error al eliminar la cuenta de MercadoLibre')
      setLoading(null)
    }
  }

  const handleReconnect = () => {
    // Reconectar directo
    window.location.href = '/api/meli/connect'
  }

  const handleSwitch = async (connectionId: string) => {
    setLoading(connectionId)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/meli/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ connectionId })
      })

      if (response.ok) {
        // Redirigir a URL limpia sin query params
        window.location.href = '/dashboard'
      } else {
        const data = await response.json()
        setErrorMessage(`Neurotry: ${data.error || 'Error al cambiar de cuenta de MercadoLibre'}`)
        setLoading(null)
      }
    } catch (error) {
      console.error('Error switching:', error)
      setErrorMessage('Neurotry: Error al cambiar de cuenta de MercadoLibre')
      setLoading(null)
    }
  }

  const handleSyncProducts = async () => {
    if (!activeConnection) {
      setErrorMessage('Neurotry: No hay cuenta activa de MercadoLibre')
      return
    }

    setLoading('sync')
    setErrorMessage(null)
    setSuccessMessage(null)

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

        if (data.count === 0) {
          setErrorMessage('Neurotry: No se encontraron productos activos en tu cuenta de MercadoLibre')
          setLoading(null)
          return
        }

        setSuccessMessage(`Neurotry: Sincronizados ${data.count} productos correctamente`)
        setLoading(null)
        // Refrescar los datos sin recargar la página completa
        router.refresh()
      } else {
        const data = await response.json()
        setErrorMessage(`Neurotry: ${data.error || 'Error al sincronizar productos de MercadoLibre'}`)
        setLoading(null)
      }
    } catch (error) {
      console.error('Error syncing products:', error)
      setErrorMessage('Neurotry: Error al sincronizar productos de MercadoLibre')
      setLoading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary-900">Conexión con MercadoLibre</CardTitle>
        <CardDescription>
          Conecta tu cuenta de MercadoLibre para sincronizar tus productos
        </CardDescription>
        {connections.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="p-4 bg-info-light border-l-4 border-l-info rounded-lg text-sm shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div className="flex-1">
                  <p className="text-blue-900 font-sans font-semibold mb-2">
                    Cuentas conectadas: {connections.filter(c => c.status === 'connected').map(c => c.meli_nickname || c.meli_email || `ID: ${c.meli_user_id}`).join(', ') || 'Ninguna'}
                  </p>
                  <p className="text-blue-800 font-body mb-3">
                    Para conectar una cuenta <strong>diferente</strong>:
                  </p>
                  <ol className="text-blue-800 font-body space-y-1.5 mb-3 ml-5 list-decimal">
                    <li>Abre MercadoLibre en otra pestaña</li>
                    <li>Click en tu nombre (arriba a la derecha)</li>
                    <li>Click en "Salir"</li>
                    <li>Vuelve aquí y haz click en "Conectar otra cuenta"</li>
                  </ol>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open('https://www.mercadolibre.com.ar', '_blank')}
                  >
                    🔗 Abrir MercadoLibre
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-4 bg-neutral-50 border-l-4 border-l-neutral-400 rounded-lg text-sm shadow-sm">
              <p className="text-neutral-900 font-sans font-semibold mb-2">Estados de cuenta:</p>
              <ul className="space-y-2 font-body text-neutral-700">
                <li className="flex items-start gap-2">
                  <Badge variant="success" className="mt-0.5">✓ Conectada</Badge>
                  <span>Tiene tokens válidos de API. Puede sincronizar productos.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="secondary" className="mt-0.5">○ Desconectada</Badge>
                  <span>Tokens invalidados. Solo muestra productos históricos. Click "Reconectar" para volver a sincronizar.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Mensajes de error y éxito */}
        {errorMessage && (
          <Alert variant="error" className="mb-4">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        {successMessage && (
          <Alert variant="success" className="mb-4">
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {connections.length === 0 ? (
            <div className="text-center py-10">
              <p className="font-body text-neutral-600 mb-6 text-lg">
                No tienes ninguna cuenta de MercadoLibre conectada
              </p>
              <Button
                onClick={handleConnect}
                className="bg-[#FFE600] text-black hover:bg-[#FFE600]/90 shadow-lg hover:shadow-xl font-sans font-bold"
              >
                Conectar con MercadoLibre
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {connections.map(connection => (
                  <div
                    key={connection.id}
                    className="flex items-center justify-between p-5 border-2 border-neutral-200 rounded-xl bg-white hover:border-primary-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-sans font-semibold text-neutral-900">
                            {connection.meli_nickname || connection.meli_email || `ID: ${connection.meli_user_id}`}
                          </span>
                          {connection.is_active && (
                            <Badge variant="info">
                              Activa
                            </Badge>
                          )}
                        </div>
                        {connection.meli_nickname && connection.meli_email && (
                          <span className="text-xs font-body text-neutral-500">
                            {connection.meli_email}
                          </span>
                        )}
                        <div className="flex items-center gap-2 text-sm flex-wrap">
                          {connection.status === 'connected' ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="success">
                                ✓ Conectada
                              </Badge>
                              <span className="text-xs font-body text-neutral-500">Puede sincronizar</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                ○ Desconectada
                              </Badge>
                              <span className="text-xs font-body text-neutral-500">Sin acceso a API</span>
                            </div>
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
                            onClick={() => openDisconnectDialog(connection.id)}
                            disabled={loading === connection.id}
                          >
                            {loading === connection.id ? 'Desconectando...' : 'Desconectar'}
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={handleReconnect}
                          className="bg-success hover:bg-success/90"
                        >
                          Reconectar
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(connection.id)}
                        disabled={loading === `delete-${connection.id}`}
                      >
                        {loading === `delete-${connection.id}` ? 'Eliminando...' : 'Eliminar'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t-2 border-neutral-200 space-y-4">
                <Button
                  onClick={handleConnect}
                  className="w-full bg-[#FFE600] text-black hover:bg-[#FFE600]/90 shadow-md hover:shadow-lg font-sans font-bold"
                >
                  Conectar otra cuenta de MercadoLibre
                </Button>

                {activeConnection && (
                  activeConnection.status === 'connected' ? (
                    <Button
                      onClick={handleSyncProducts}
                      disabled={loading === 'sync'}
                      className="w-full"
                      size="lg"
                    >
                      {loading === 'sync' ? 'Sincronizando...' : 'Sincronizar productos'}
                    </Button>
                  ) : (
                    <Alert variant="warning">
                      <AlertDescription className="text-center font-body">
                        ⚠️ La cuenta activa está desconectada. Reconéctala para sincronizar productos.
                      </AlertDescription>
                    </Alert>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>

      {/* Dialog de confirmación para desconectar */}
      <Dialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neurotry - Desconectar cuenta</DialogTitle>
            <DialogDescription>
              ¿Estás seguro que deseas desconectar esta cuenta de MercadoLibre?
              <br /><br />
              Se invalidarán los tokens de acceso pero se mantendrán los datos y publicaciones sincronizadas anteriormente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDisconnectDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={handleDisconnect}
            >
              Desconectar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">⚠️ Neurotry - Eliminar cuenta</DialogTitle>
            <DialogDescription>
              <strong className="text-red-700">Esta acción no se puede deshacer.</strong>
              <br /><br />
              ¿Estás seguro que deseas eliminar completamente esta cuenta de MercadoLibre?
              <br /><br />
              Se borrarán <strong>todos los datos y publicaciones</strong> asociadas a esta cuenta.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Eliminar permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
