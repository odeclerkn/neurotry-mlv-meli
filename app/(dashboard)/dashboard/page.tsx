import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { MeliConnectButton } from '@/components/dashboard/meli-connect-button'
import { ClearSuccessMessage } from '@/components/dashboard/clear-success-message'
import { getAllMeliConnections, getMeliProducts, getActiveMeliConnection } from '@/lib/meli/tokens'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { meli_success?: string; meli_error?: string; meli_user_id?: string }
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Obtener conexiones de MELI
  const meliConnections = await getAllMeliConnections(user.id)
  const activeConnection = await getActiveMeliConnection(user.id)

  // Obtener productos si hay conexión activa
  let products = []
  if (activeConnection) {
    products = await getMeliProducts(activeConnection.id)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <ClearSuccessMessage />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido, {profile?.full_name || user.email}
        </h1>
        <p className="text-gray-600 mt-2">
          Dashboard de optimización de publicaciones
        </p>
      </div>

      {/* Mostrar mensajes de éxito o error */}
      {searchParams.meli_success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            {searchParams.meli_success === 'new_connection' && (
              <>✅ Nueva cuenta de MercadoLibre conectada (ID: {searchParams.meli_user_id})</>
            )}
            {searchParams.meli_success === 'reconnected' && (
              <>✅ Cuenta reconectada exitosamente (ID: {searchParams.meli_user_id})</>
            )}
            {searchParams.meli_success === 'already_connected' && (
              <>✅ Tokens actualizados exitosamente (ID: {searchParams.meli_user_id})</>
            )}
            {searchParams.meli_success === 'true' && (
              <>✅ Cuenta de MercadoLibre conectada exitosamente</>
            )}
          </AlertDescription>
        </Alert>
      )}

      {searchParams.meli_error && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">
            ❌ Error al conectar con MercadoLibre. Por favor, intenta de nuevo.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Tarjeta de conexión MELI */}
        <MeliConnectButton connections={meliConnections} />

        {/* Tarjeta de productos */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Productos</CardTitle>
            <CardDescription>
              {activeConnection ? (
                <div className="flex items-center gap-2">
                  <span>Productos de la cuenta {activeConnection.meli_user_id}</span>
                  {activeConnection.status === 'connected' ? (
                    <Badge className="bg-green-500">✓ Conectada - Puede sincronizar</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-400">○ Desconectada - Solo históricos</Badge>
                  )}
                </div>
              ) : (
                'Tus publicaciones de MercadoLibre aparecerán aquí'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <Alert>
                <AlertDescription>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-lg font-semibold mb-2">
                      {activeConnection
                        ? 'No hay productos sincronizados'
                        : 'Lista de productos vacía'}
                    </h3>
                    <p className="text-gray-600 max-w-md">
                      {activeConnection
                        ? activeConnection.status === 'connected'
                          ? 'Haz clic en "Sincronizar productos" para cargar tus publicaciones de MercadoLibre.'
                          : 'Esta cuenta está desconectada. Reconéctala para sincronizar nuevos productos.'
                        : 'Conecta tu cuenta de MercadoLibre para ver tus publicaciones aquí.'}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {product.thumbnail && (
                      <img
                        src={product.thumbnail}
                        alt={product.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                        {product.title}
                      </h3>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-green-600">
                          ${product.price?.toLocaleString('es-MX')}
                        </span>
                        <span className="text-gray-500">
                          Stock: {product.available_quantity}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Vendidos: {product.sold_quantity || 0}
                      </div>
                      {product.status && (
                        <div className="mt-2">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              product.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {product.status}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estadísticas */}
        {products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total de productos</CardDescription>
                <CardTitle className="text-3xl">{products.length}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total vendidos</CardDescription>
                <CardTitle className="text-3xl">
                  {products.reduce((sum, p) => sum + (p.sold_quantity || 0), 0)}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Stock total</CardDescription>
                <CardTitle className="text-3xl">
                  {products.reduce((sum, p) => sum + (p.available_quantity || 0), 0)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Información adicional */}
        <Card>
          <CardHeader>
            <CardTitle>Funcionalidades disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>Autenticación con Supabase</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>Conexión con MercadoLibre (múltiples cuentas)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>Sincronización de productos</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">⏳</span>
                <span>Próximamente: Análisis y optimización con IA</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">⏳</span>
                <span>Próximamente: Recomendaciones automáticas</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
