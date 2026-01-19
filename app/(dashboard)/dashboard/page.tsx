import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import MeliConnectionCard from '@/components/dashboard/MeliConnectionCard'

export default async function DashboardPage() {
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

  // Verificar si tiene MELI conectado
  const { data: meliConnection } = await supabase
    .from('meli_connections')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido, {profile?.full_name || user.email}
        </h1>
        <p className="text-gray-600 mt-2">
          Dashboard de optimización de publicaciones
        </p>
      </div>

      <div className="grid gap-6">
        {/* Estado de conexión con MercadoLibre */}
        <MeliConnectionCard connection={meliConnection} />

        {/* Tarjeta de productos */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Productos</CardTitle>
            <CardDescription>
              Tus publicaciones de MercadoLibre aparecerán aquí
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-lg font-semibold mb-2">
                    Lista de productos vacía
                  </h3>
                  <p className="text-gray-600 max-w-md">
                    {!meliConnection
                      ? 'Conecta tu cuenta de MercadoLibre para ver tus publicaciones.'
                      : 'Próximamente podrás sincronizar tus publicaciones automáticamente.'}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <Card>
          <CardHeader>
            <CardTitle>Próximos pasos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>Cuenta creada y autenticación funcionando</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">{meliConnection ? '✅' : '⏳'}</span>
                <span>
                  {meliConnection
                    ? 'MercadoLibre conectado'
                    : 'Conectar con MercadoLibre'}
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">⏳</span>
                <span>Próximamente: Sincronización automática de productos</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">⏳</span>
                <span>Próximamente: Análisis y optimización con IA</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
