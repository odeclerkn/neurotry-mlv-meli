import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { MeliConnectButton } from '@/components/dashboard/meli-connect-button'
import { ClearSuccessMessage } from '@/components/dashboard/clear-success-message'
import { ProductsTable } from '@/components/dashboard/products-table'
import { ExportAnalysisButton } from '@/components/dashboard/export-analysis-button'
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
  let productsWithAnalysis = 0
  let lastSyncDate: Date | null = null
  if (activeConnection) {
    products = await getMeliProducts(activeConnection.id)
    // Contar productos con análisis (puede ser array u objeto)
    productsWithAnalysis = products.filter((p: any) => {
      if (Array.isArray(p.product_ai_analysis)) {
        return p.product_ai_analysis.length > 0
      }
      return p.product_ai_analysis && typeof p.product_ai_analysis === 'object'
    }).length

    // Obtener la fecha de última sincronización
    if (products.length > 0) {
      const syncDates = products
        .map((p: any) => p.last_sync_at || p.created_at)
        .filter(Boolean)
        .map((d: string) => new Date(d))

      if (syncDates.length > 0) {
        lastSyncDate = new Date(Math.max(...syncDates.map(d => d.getTime())))
      }
    }

    console.log('Dashboard - Total productos:', products.length)
    console.log('Dashboard - Con análisis:', productsWithAnalysis)
  }

  return (
    <div className="min-h-screen bg-gradient-light">
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <ClearSuccessMessage />

        <div className="mb-8">
          <h1 className="text-4xl font-sans font-bold text-primary-900 mb-2">
            Bienvenido, {profile?.full_name || user.email}
          </h1>
          <p className="text-lg font-body text-neutral-600">
            Dashboard de optimización de publicaciones
          </p>
        </div>

        {/* Información sobre el valor de la herramienta */}
        <Alert variant="info" className="mb-6">
          <AlertDescription>
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">💡</div>
              <div>
                <p className="font-body text-neutral-700 mb-2">
                  Esta herramienta usa <strong>Inteligencia Artificial</strong> para analizar tus publicaciones
                  y compararlas con los productos más exitosos. El resultado: sugerencias para aumentar tu visibilidad y ventas.
                </p>
                <Link
                  href="/value-proposition"
                  className="text-primary-600 hover:text-primary-700 font-sans font-semibold text-sm underline"
                >
                  Conoce cómo funciona y por qué deberías usarlo →
                </Link>
              </div>
            </div>
          </AlertDescription>
        </Alert>

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
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-primary-900">Mis Publicaciones</CardTitle>
                  <CardDescription>
                    {activeConnection ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>Productos de la cuenta {(activeConnection as any).meli_nickname || (activeConnection as any).meli_email || activeConnection.meli_user_id}</span>
                          {activeConnection.status === 'connected' ? (
                            <Badge variant="success">✓ Conectada - Puede sincronizar</Badge>
                          ) : (
                            <Badge variant="secondary">○ Desconectada - Solo históricos</Badge>
                          )}
                        </div>
                        {lastSyncDate && (
                          <div className="text-xs text-neutral-500">
                            Última sincronización: {lastSyncDate.toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      'Tus publicaciones de MercadoLibre aparecerán aquí'
                    )}
                  </CardDescription>
                </div>
                {productsWithAnalysis > 0 && <ExportAnalysisButton />}
              </div>
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
              <ProductsTable products={products} />
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}
