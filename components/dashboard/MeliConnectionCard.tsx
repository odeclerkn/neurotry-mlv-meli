'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface MeliConnection {
  id: string
  meli_user_id: number
  meli_nickname: string | null
  connected_at: string
  last_sync_at: string | null
  is_active: boolean
}

interface Props {
  connection: MeliConnection | null
}

export default function MeliConnectionCard({ connection }: Props) {
  const handleConnect = () => {
    window.location.href = '/api/meli/connect'
  }

  if (!connection) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            Cuenta de MercadoLibre no conectada
          </CardTitle>
          <CardDescription>
            Necesitas conectar tu cuenta de MercadoLibre para ver y optimizar tus publicaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4 bg-white">
            <AlertDescription>
              <div className="space-y-2 text-sm text-gray-700">
                <p className="font-semibold">¿Qué sucede al conectar?</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Serás redirigido a MercadoLibre para autorizar el acceso</li>
                  <li>Solo solicitamos permisos de <strong>lectura</strong> de tus publicaciones</li>
                  <li>Podrás sincronizar y analizar tus productos</li>
                  <li>Tus credenciales se guardan de forma segura y encriptada</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleConnect}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
            size="lg"
          >
            🔗 Conectar con MercadoLibre
          </Button>
        </CardContent>
      </Card>
    )
  }

  const lastSync = connection.last_sync_at
    ? new Date(connection.last_sync_at).toLocaleString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Nunca'

  const connectedAt = new Date(connection.connected_at).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">✅</span>
          Conectado a MercadoLibre
        </CardTitle>
        <CardDescription>
          Tu cuenta está vinculada y lista para sincronizar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
            <span className="text-gray-600">Usuario MELI:</span>
            <span className="font-semibold">
              @{connection.meli_nickname || `ID: ${connection.meli_user_id}`}
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
            <span className="text-gray-600">Conectado desde:</span>
            <span className="font-semibold">{connectedAt}</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
            <span className="text-gray-600">Última sincronización:</span>
            <span className="font-semibold">{lastSync}</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
            <span className="text-gray-600">Estado:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {connection.is_active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-green-200">
          <p className="text-xs text-gray-600 text-center">
            Próximamente podrás sincronizar tus productos y ver análisis detallados
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
