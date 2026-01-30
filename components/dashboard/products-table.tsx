'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

interface ProductsTableProps {
  products: any[]
}

export function ProductsTable({ products }: ProductsTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null)

  // Debug: mostrar en consola los productos con análisis (solo una vez)
  const productsWithAnalysis = products.filter((p: any) => p.product_ai_analysis)
  console.log(`📊 ProductsTable - Total: ${products.length}, Con análisis: ${productsWithAnalysis.length}`)

  const handleProductClick = (product: any) => {
    console.log('🔵 Navegando a análisis del producto:', product.title)
    setLoadingProductId(product.meli_product_id)
    startTransition(() => {
      router.push(`/analysis/${product.meli_product_id}`)
    })
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-neutral-200 bg-neutral-50">
              <th className="w-20 p-3"></th>
              <th className="text-left p-3 font-sans font-semibold text-sm text-neutral-700">Título</th>
              <th className="text-left p-3 font-sans font-semibold text-sm text-neutral-700">Descripción</th>
              <th className="text-left p-3 font-sans font-semibold text-sm text-neutral-700">Análisis IA</th>
              <th className="text-right p-3 font-sans font-semibold text-sm text-neutral-700">Precio</th>
              <th className="text-center p-3 font-sans font-semibold text-sm text-neutral-700">Stock</th>
              <th className="text-center p-3 font-sans font-semibold text-sm text-neutral-700">Vendidos</th>
              <th className="text-center p-3 font-sans font-semibold text-sm text-neutral-700">Estado</th>
              <th className="text-center p-3 font-sans font-semibold text-sm text-neutral-700">🤖 Score</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => {
              const isLoading = loadingProductId === product.meli_product_id
              return (
              <tr
                key={product.id}
                onClick={() => handleProductClick(product)}
                className={`border-b border-neutral-200 hover:bg-primary-50 transition-colors cursor-pointer ${
                  index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'
                } ${isLoading ? 'opacity-60 animate-pulse' : ''}`}
              >
                <td className="p-3">
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="w-full h-full object-cover rounded border border-neutral-200"
                    />
                    {product.is_new && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                    )}
                    {product.is_updated && !product.is_new && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>
                </td>
                <td className="p-3 font-body text-sm text-neutral-900 max-w-xs">
                  <div className="flex items-center gap-2">
                    <div className="line-clamp-2 flex-1">
                      {product.title}
                    </div>
                    {product.is_new && (
                      <span className="flex items-center gap-1 bg-green-500 text-white text-[10px] font-sans font-bold px-1.5 py-0.5 rounded-full shadow-sm flex-shrink-0">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                        NEW
                      </span>
                    )}
                    {product.is_updated && !product.is_new && (
                      <span className="flex items-center gap-1 bg-blue-500 text-white text-[10px] font-sans font-bold px-1.5 py-0.5 rounded-full shadow-sm flex-shrink-0">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                        UPD
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3 font-body text-xs text-neutral-600 max-w-sm">
                  <div className="line-clamp-2">
                    {product.description || 'Sin descripción'}
                  </div>
                </td>
                <td className="p-3 text-center">
                  {(() => {
                    if (!product.product_ai_analysis) {
                      return <span className="text-xs text-neutral-500">No tiene</span>
                    }

                    // Puede ser un objeto o un array
                    const analysis = Array.isArray(product.product_ai_analysis)
                      ? product.product_ai_analysis[0]
                      : product.product_ai_analysis

                    if (!analysis) {
                      return <span className="text-xs text-neutral-500">No tiene</span>
                    }

                    return <span className="text-xs text-green-600 font-medium">Tiene</span>
                  })()}
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
                <td className="p-3 text-center">
                  {(() => {
                    if (!product.product_ai_analysis) {
                      return <span className="text-xs text-neutral-400">-</span>
                    }

                    // Puede ser un objeto o un array
                    const analysis = Array.isArray(product.product_ai_analysis)
                      ? product.product_ai_analysis[0]
                      : product.product_ai_analysis

                    if (!analysis || typeof analysis.overall_score !== 'number') {
                      return <span className="text-xs text-neutral-400">-</span>
                    }

                    const providerName =
                      analysis.ai_provider === 'anthropic' ? 'Claude' :
                      analysis.ai_provider === 'openai' ? 'GPT-4' :
                      analysis.ai_provider === 'gemini' ? 'Gemini' : 'Básico'

                    return (
                      <div className="inline-flex items-center gap-2">
                        <Badge
                          variant={
                            analysis.overall_score >= 7
                              ? 'success'
                              : analysis.overall_score >= 4
                              ? 'warning'
                              : 'destructive'
                          }
                          className="text-xs font-semibold"
                        >
                          {analysis.overall_score}/10
                        </Badge>
                        <span className="text-[10px] text-neutral-500 whitespace-nowrap">
                          {providerName}
                        </span>
                      </div>
                    )
                  })()}
                </td>
              </tr>
            )
            })}
          </tbody>
        </table>
      </div>

      {/* Indicador de carga global */}
      {isPending && loadingProductId && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-neutral-700 font-body">Cargando análisis del producto...</p>
          </div>
        </div>
      )}
    </>
  )
}
