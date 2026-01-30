import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ProductAnalysisView } from './product-analysis-view'

export default async function AnalysisPage({ params }: { params: { productId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener el producto con todos sus datos
  const { data: product, error } = await supabase
    .from('meli_products')
    .select(`
      *,
      connection:meli_connections!inner(user_id)
    `)
    .eq('meli_product_id', params.productId)
    .eq('connection.user_id', user.id)
    .single()

  if (error || !product) {
    console.error('Error fetching product:', error)
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-light">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Breadcrumb y navegación */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-primary-600 hover:text-primary-700 font-body text-sm flex items-center gap-2 transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>Volver al Dashboard</span>
          </Link>

          {product.permalink && (
            <a
              href={product.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 font-body text-sm flex items-center gap-2 transition-colors"
            >
              <span>Ver en MercadoLibre</span>
              <span>→</span>
            </a>
          )}
        </div>

        {/* Título de la página */}
        <div className="mb-6">
          <h1 className="text-3xl font-sans font-bold text-primary-900 mb-2">
            Análisis de Publicación
          </h1>
          <p className="text-lg font-body text-neutral-600">
            Información completa, keywords trending y optimización con IA
          </p>
        </div>

        {/* Client Component con toda la funcionalidad */}
        <ProductAnalysisView product={product} />
      </div>
    </div>
  )
}
