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
                    <span>Productos de la cuenta {(activeConnection as any).meli_nickname || (activeConnection as any).meli_email || activeConnection.meli_user_id}</span>
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-neutral-200 bg-neutral-50">
                      <th className="text-left p-3 font-sans font-semibold text-sm text-neutral-700"></th>
                      <th className="text-left p-3 font-sans font-semibold text-sm text-neutral-700">Título</th>
                      <th className="text-right p-3 font-sans font-semibold text-sm text-neutral-700">Precio</th>
                      <th className="text-center p-3 font-sans font-semibold text-sm text-neutral-700">Stock</th>
                      <th className="text-center p-3 font-sans font-semibold text-sm text-neutral-700">Vendidos</th>
                      <th className="text-center p-3 font-sans font-semibold text-sm text-neutral-700">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, index) => (
                      <tr
                        key={product.id}
                        className={`border-b border-neutral-200 hover:bg-primary-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'
                        }`}
                      >
                        <td className="p-3 w-20">
                          {product.thumbnail && (
                            <img
                              src={product.thumbnail}
                              alt={product.title}
                              className="w-16 h-16 object-cover rounded-lg border border-neutral-200"
                            />
                          )}
                        </td>
                        <td className="p-3 font-body text-sm text-neutral-900 max-w-md">
                          <a
                            href={product.permalink || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary-700 hover:underline"
                          >
                            {product.title}
                          </a>
                        </td>
                        <td className="p-3 text-right font-sans font-bold text-success whitespace-nowrap">
                          ${product.price?.toLocaleString('es-AR')}
                        </td>
                        <td className="p-3 text-center font-body text-neutral-700">
                          {product.available_quantity}
                        </td>
                        <td className="p-3 text-center font-body text-neutral-700">
                          {product.sold_quantity || 0}
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            variant={product.status === 'active' ? 'success' : 'secondary'}
                            className="text-xs"
                          >
                            {product.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
