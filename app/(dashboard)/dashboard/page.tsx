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
  let products: Awaited<ReturnType<typeof getMeliProducts>> = []
  if (activeConnection) {
    products = await getMeliProducts(activeConnection.id)
  }

  return (
    <div className="min-h-screen bg-gradient-light">
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <ClearSuccessMessage />

        <div className="mb-10">
          <h1 className="text-4xl font-sans font-bold text-primary-900 mb-2">
            Bienvenido, {profile?.full_name || user.email}
          </h1>
          <p className="text-lg font-body text-neutral-600">
            Dashboard de optimización de publicaciones
          </p>
        </div>

        {/* Mostrar mensajes de éxito o error */}
        {searchParams.meli_success && (
          <Alert variant="success" className="mb-6">
            <AlertDescription>
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
          <Alert variant="error" className="mb-6">
            <AlertDescription>
              ❌ Error al conectar con MercadoLibre. Por favor, intenta de nuevo.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-8">
          {/* Tarjeta de conexión MELI */}
          <MeliConnectButton connections={meliConnections} />

          {/* Tarjeta de productos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-primary-900">Mis Publicaciones</CardTitle>
              <CardDescription>
                {activeConnection ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>Productos de la cuenta {activeConnection.meli_user_id}</span>
                    {activeConnection.status === 'connected' ? (
                      <Badge variant="success">✓ Conectada - Puede sincronizar</Badge>
                    ) : (
                      <Badge variant="secondary">○ Desconectada - Solo históricos</Badge>
                    )}
                  </div>
                ) : (
                  'Tus publicaciones de MercadoLibre aparecerán aquí'
                )}
              </CardDescription>
            </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <Alert variant="info">
                <AlertDescription>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-lg font-sans font-bold mb-2 text-neutral-900">
                      {activeConnection
                        ? 'No hay productos sincronizados'
                        : 'Lista de productos vacía'}
                    </h3>
                    <p className="font-body text-neutral-700 max-w-md">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="border-2 border-neutral-200 rounded-xl overflow-hidden hover:shadow-xl hover:border-primary-300 transition-all duration-200 bg-white"
                  >
                    {product.thumbnail && (
                      <img
                        src={product.thumbnail}
                        alt={product.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-5">
                      <h3 className="font-sans font-semibold text-sm mb-3 line-clamp-2 text-neutral-900">
                        {product.title}
                      </h3>
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="font-sans font-bold text-lg text-success">
                          ${product.price?.toLocaleString('es-MX')}
                        </span>
                        <span className="font-body text-neutral-600">
                          Stock: {product.available_quantity}
                        </span>
                      </div>
                      <div className="mt-2 text-xs font-body text-neutral-500">
                        Vendidos: {product.sold_quantity || 0}
                      </div>
                      {product.status && (
                        <div className="mt-3">
                          <Badge
                            variant={product.status === 'active' ? 'success' : 'secondary'}
                            className="text-xs"
                          >
                            {product.status}
                          </Badge>
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
              <Card className="bg-gradient-to-br from-primary-50 to-white border-primary-200">
                <CardHeader className="pb-3">
                  <CardDescription>Total de productos</CardDescription>
                  <CardTitle className="text-4xl text-primary-700">{products.length}</CardTitle>
                </CardHeader>
              </Card>

              <Card className="bg-gradient-to-br from-success-light to-white border-green-200">
                <CardHeader className="pb-3">
                  <CardDescription>Total vendidos</CardDescription>
                  <CardTitle className="text-4xl text-success">
                    {products.reduce((sum, p) => sum + (p.sold_quantity || 0), 0)}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="bg-gradient-to-br from-info-light to-white border-blue-200">
                <CardHeader className="pb-3">
                  <CardDescription>Stock total</CardDescription>
                  <CardTitle className="text-4xl text-info">
                    {products.reduce((sum, p) => sum + (p.available_quantity || 0), 0)}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
          )}

          {/* Información adicional */}
          <Card className="border-primary-200 bg-gradient-to-br from-white to-primary-50">
            <CardHeader>
              <CardTitle className="text-primary-900">Funcionalidades disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm font-body">
                <li className="flex items-start">
                  <span className="mr-3 text-lg">✅</span>
                  <span className="text-neutral-900">Autenticación con Supabase</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-lg">✅</span>
                  <span className="text-neutral-900">Conexión con MercadoLibre (múltiples cuentas)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-lg">✅</span>
                  <span className="text-neutral-900">Sincronización de productos</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-lg">⏳</span>
                  <span className="text-neutral-600">Próximamente: Análisis y optimización con IA</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-lg">⏳</span>
                  <span className="text-neutral-600">Próximamente: Recomendaciones automáticas</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
