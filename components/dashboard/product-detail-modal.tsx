'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ProductDetailModalProps {
  product: any
  isOpen: boolean
  onClose: () => void
}

export function ProductDetailModal({ product, isOpen, onClose }: ProductDetailModalProps) {
  const [keywords, setKeywords] = useState<any[]>([])
  const [loadingKeywords, setLoadingKeywords] = useState(false)
  const [competitors, setCompetitors] = useState<any[]>([])
  const [analysis, setAnalysis] = useState<any>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [deletingAnalysis, setDeletingAnalysis] = useState(false)
  const [aiProvider, setAiProvider] = useState<string>('')
  const [analyzedAt, setAnalyzedAt] = useState<string>('')

  useEffect(() => {
    if (isOpen && product) {
      // Resetear estados al abrir el modal
      setAnalysis(null)
      setAiProvider('')
      setAnalyzedAt('')

      if (product.category_id) {
        fetchKeywords()
      }
      if (product.meli_product_id) {
        fetchCompetitors()
        fetchSavedAnalysis()
      }
    }
  }, [isOpen, product])

  const fetchKeywords = async () => {
    if (!product?.category_id) {
      console.log('No category_id en producto:', product)
      return
    }

    console.log('Fetching keywords para categoría:', product.category_id)
    setLoadingKeywords(true)
    setKeywords([])
    try {
      const response = await fetch(`/api/meli/trending-keywords?category_id=${product.category_id}`)
      console.log('Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Keywords recibidos:', data)
        setKeywords(data.keywords || [])
      } else {
        console.error('Response no OK:', response.status)
      }
    } catch (error) {
      console.error('Error fetching keywords:', error)
    } finally {
      setLoadingKeywords(false)
    }
  }

  const fetchCompetitors = async () => {
    if (!product?.meli_product_id) return

    console.log('Fetching competidores para:', product.meli_product_id)
    try {
      const response = await fetch(`/api/meli/similar-products?product_id=${product.meli_product_id}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Competidores recibidos:', data)
        setCompetitors(data.competitors || [])
      } else {
        console.error('Error fetching competitors:', response.status)
      }
    } catch (error) {
      console.error('Error fetching competitors:', error)
    }
  }

  const fetchSavedAnalysis = async () => {
    if (!product?.meli_product_id) {
      console.log('⚠️ No meli_product_id, skipping fetchSavedAnalysis')
      return
    }

    const url = `/api/meli/analyze-listing?product_id=${product.meli_product_id}`
    console.log('🔵 Buscando análisis guardado en:', url)

    try {
      const response = await fetch(url)
      console.log('🔵 Response status:', response.status, response.statusText)

      if (response.ok) {
        const data = await response.json()
        console.log('🟢 Análisis guardado encontrado:', data)
        if (data.hasAnalysis) {
          setAnalysis(data.analysis)
          setAiProvider(data.provider || 'unknown')
          setAnalyzedAt(data.analyzedAt || '')
        } else {
          console.log('ℹ️ No hay análisis guardado para este producto')
        }
      } else {
        const errorText = await response.text()
        console.error('🔴 Error fetching saved analysis:', response.status, errorText)
      }
    } catch (error) {
      console.error('🔴 Error fetching saved analysis:', error)
    }
  }

  const fetchAnalysis = async () => {
    if (!product?.meli_product_id || keywords.length === 0) return

    console.log('Analizando publicación con IA...')
    setLoadingAnalysis(true)
    try {
      const response = await fetch('/api/meli/analyze-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.meli_product_id,
          keywords: keywords
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Análisis recibido:', data)
        setAnalysis(data.analysis)
        setAiProvider(data.provider || 'unknown')
        setAnalyzedAt(new Date().toISOString())
      } else {
        console.error('Error en análisis:', response.status)
      }
    } catch (error) {
      console.error('Error fetching analysis:', error)
    } finally {
      setLoadingAnalysis(false)
    }
  }

  const deleteAnalysis = async () => {
    if (!product?.meli_product_id) return

    if (!confirm('¿Estás seguro de que quieres eliminar este análisis?')) return

    console.log('Eliminando análisis...')
    setDeletingAnalysis(true)
    try {
      const response = await fetch(`/api/meli/analyze-listing?product_id=${product.meli_product_id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        console.log('Análisis eliminado correctamente')
        setAnalysis(null)
        setAiProvider('')
        setAnalyzedAt('')
      } else {
        console.error('Error eliminando análisis:', response.status)
        alert('Error al eliminar el análisis. Por favor, intenta de nuevo.')
      }
    } catch (error) {
      console.error('Error deleting analysis:', error)
      alert('Error al eliminar el análisis. Por favor, intenta de nuevo.')
    } finally {
      setDeletingAnalysis(false)
    }
  }

  // Función para verificar si un keyword está presente en título o descripción
  const isKeywordUsed = (keyword: string): boolean => {
    if (!product) return false

    const normalizedKeyword = keyword.toLowerCase().trim()
    const title = (product.title || '').toLowerCase()
    const description = (product.description || '').toLowerCase()

    // Buscar el keyword completo o como parte de una palabra
    return title.includes(normalizedKeyword) || description.includes(normalizedKeyword)
  }

  // Función para obtener el análisis de un keyword específico
  const getKeywordAnalysis = (keyword: string) => {
    if (!analysis?.keywordAnalysis) return null
    return analysis.keywordAnalysis.find((ka: any) => ka.keyword.toLowerCase() === keyword.toLowerCase())
  }

  if (!product) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary-900 text-2xl">Detalle de Publicación</DialogTitle>
          <DialogDescription>
            Información completa y keywords trending de la categoría
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Imagen y título */}
          <div className="flex gap-6">
            {product.thumbnail && (
              <div className="relative">
                <img
                  src={product.thumbnail}
                  alt={product.title}
                  className="w-48 h-48 object-cover rounded-xl border-2 border-neutral-200"
                />
                {product.is_new && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-sans font-bold px-2 py-1 rounded-full shadow-md">
                    NUEVO
                  </div>
                )}
                {product.is_updated && !product.is_new && (
                  <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-sans font-bold px-2 py-1 rounded-full shadow-md">
                    ACTUALIZADO
                  </div>
                )}
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-xl font-sans font-bold text-neutral-900 mb-3">
                {product.title}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-body text-neutral-600">Estado:</span>
                  <Badge variant={product.status === 'active' ? 'success' : 'secondary'}>
                    {product.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-body text-neutral-600">ID MELI:</span>
                  <span className="text-sm font-mono text-neutral-900">{product.meli_product_id}</span>
                </div>
                {product.permalink && (
                  <a
                    href={product.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-500 hover:text-primary-700 hover:underline inline-block"
                  >
                    Ver en MercadoLibre →
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Descripción */}
          {product.description && (
            <div>
              <h4 className="text-lg font-sans font-semibold text-primary-900 mb-2">Descripción</h4>
              <p className="text-sm font-body text-neutral-700 whitespace-pre-wrap bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                {product.description}
              </p>
            </div>
          )}

          {/* Información comercial */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-success-light to-white p-4 rounded-lg border-2 border-green-200">
              <p className="text-xs font-body text-neutral-600 mb-1">Precio</p>
              <p className="text-2xl font-sans font-bold text-success">
                ${product.price?.toLocaleString('es-AR')}
              </p>
            </div>
            <div className="bg-gradient-to-br from-info-light to-white p-4 rounded-lg border-2 border-blue-200">
              <p className="text-xs font-body text-neutral-600 mb-1">Stock disponible</p>
              <p className="text-2xl font-sans font-bold text-info">
                {product.available_quantity}
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary-50 to-white p-4 rounded-lg border-2 border-primary-200">
              <p className="text-xs font-body text-neutral-600 mb-1">Vendidos</p>
              <p className="text-2xl font-sans font-bold text-primary-700">
                {product.sold_quantity || 0}
              </p>
            </div>
            <div className="bg-gradient-to-br from-neutral-50 to-white p-4 rounded-lg border-2 border-neutral-200">
              <p className="text-xs font-body text-neutral-600 mb-1">Tipo de anuncio</p>
              <p className="text-sm font-sans font-semibold text-neutral-900">
                {(() => {
                  const type = product.listing_type_id?.toLowerCase() || ''
                  if (type.includes('gold')) return '⭐ Premium (Gold)'
                  if (type.includes('silver')) return '💎 Destacado (Silver)'
                  if (type.includes('bronze')) return '🥉 Bronce'
                  if (type.includes('free')) return '📢 Gratuito'
                  return product.listing_type_id || 'N/A'
                })()}
              </p>
            </div>
          </div>

          {/* Botón de análisis y estado */}
          {keywords.length > 0 && (
            <div className="flex items-center justify-between gap-4 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={fetchAnalysis}
                  disabled={loadingAnalysis || deletingAnalysis}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors font-sans font-semibold text-sm"
                >
                  {loadingAnalysis ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Analizando...
                    </span>
                  ) : (
                    analysis ? '🔄 Re-analizar con IA' : '🤖 Analizar con IA'
                  )}
                </button>
                {analysis && (
                  <button
                    onClick={deleteAnalysis}
                    disabled={loadingAnalysis || deletingAnalysis}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors font-sans font-semibold text-sm"
                  >
                    {deletingAnalysis ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Eliminando...
                      </span>
                    ) : (
                      '🗑️ Borrar análisis'
                    )}
                  </button>
                )}
                {aiProvider && analysis && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-body text-neutral-700">
                      Analizado con {aiProvider === 'anthropic' ? 'Claude' : aiProvider === 'openai' ? 'GPT-4' : aiProvider === 'gemini' ? 'Gemini' : 'análisis básico'}
                    </span>
                    {analyzedAt && (
                      <span className="text-sm font-body text-neutral-500">
                        el {new Date(analyzedAt).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Keywords de la categoría */}
          <div>
            <h4 className="text-lg font-sans font-semibold text-primary-900 mb-1">
              Keywords de tu categoría
            </h4>
            <p className="text-sm font-body text-neutral-600 mb-3">
              Términos más buscados o usados por productos exitosos. El score (ej: 8/10) indica qué tan relevante es cada keyword para tu producto específico.
            </p>
            {loadingKeywords ? (
              <Alert variant="info">
                <AlertDescription>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    Cargando keywords trending...
                  </div>
                </AlertDescription>
              </Alert>
            ) : keywords.length > 0 ? (
              <>
              <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                <div className="flex items-center gap-2 mb-3 px-1 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs font-body text-neutral-600">Relevante y utilizado</span>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-xs font-body text-neutral-600">Relevante pero no utilizado</span>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-xs font-body text-neutral-600">No relevante</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {keywords.map((kw, index) => {
                    const isUsed = isKeywordUsed(kw.keyword)
                    const kwAnalysis = getKeywordAnalysis(kw.keyword)

                    // Determinar el color basado en análisis de IA o análisis básico
                    let statusColor = 'bg-gray-500'
                    let borderColor = 'border-gray-200'
                    let statusTitle = 'Sin analizar'

                    if (kwAnalysis) {
                      if (kwAnalysis.isRelevant && isUsed) {
                        statusColor = 'bg-green-500'
                        borderColor = 'border-green-200 hover:border-green-300'
                        statusTitle = `Relevante (${kwAnalysis.score}/10): ${kwAnalysis.reason}`
                      } else if (kwAnalysis.isRelevant && !isUsed) {
                        statusColor = 'bg-yellow-500'
                        borderColor = 'border-yellow-200 hover:border-yellow-300'
                        statusTitle = `Relevante pero no usado (${kwAnalysis.score}/10): ${kwAnalysis.reason}`
                      } else {
                        statusColor = 'bg-red-500'
                        borderColor = 'border-red-200 hover:border-red-300'
                        statusTitle = `No relevante (${kwAnalysis.score}/10): ${kwAnalysis.reason}`
                      }
                    } else {
                      // Sin análisis IA, usar lógica básica
                      if (isUsed) {
                        statusColor = 'bg-green-500'
                        borderColor = 'border-green-200 hover:border-green-300'
                        statusTitle = 'Utilizado en la publicación'
                      } else {
                        statusColor = 'bg-gray-400'
                        borderColor = 'border-gray-200 hover:border-gray-300'
                        statusTitle = 'No utilizado - Analizar con IA para ver si es relevante'
                      }
                    }

                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between bg-white p-3 rounded-lg border transition-colors ${borderColor}`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex items-center justify-center w-8 h-8 flex-shrink-0 rounded-full bg-primary-100 text-primary-700 font-sans font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div
                              className={`w-3 h-3 rounded-full ${statusColor} flex-shrink-0`}
                              title={statusTitle}
                            ></div>
                            <div className="flex flex-col flex-1 min-w-0">
                              <span
                                className="font-body text-sm text-neutral-900 truncate"
                                title={kw.keyword}
                              >
                                {kw.keyword}
                              </span>
                              {kwAnalysis && kwAnalysis.reason && (
                                <span
                                  className="text-xs text-neutral-500 truncate cursor-help"
                                  title={`Razón: ${kwAnalysis.reason}`}
                                >
                                  {kwAnalysis.reason}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end ml-2 flex-shrink-0">
                          {kwAnalysis && (
                            <div
                              className="px-2 py-1 bg-primary-100 rounded text-xs font-semibold text-primary-700 whitespace-nowrap"
                              title={`Score de relevancia: ${kwAnalysis.score} de 10. ${kwAnalysis.reason}`}
                            >
                              {kwAnalysis.score}/10
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              </>
            ) : (
              <Alert variant="info">
                <AlertDescription>
                  <div>
                    <p className="mb-2">No se encontraron keywords trending para esta categoría.</p>
                    <p className="text-xs text-neutral-600">
                      Categoría: {product.category_id || 'Sin categoría'}
                    </p>
                    {!product.category_id && (
                      <p className="text-xs text-red-600 mt-1">⚠️ El producto no tiene category_id</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Sugerencias de IA */}
          {analysis?.suggestions && (
            <div className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🤖</span>
                <h4 className="text-lg font-sans font-semibold text-purple-900">
                  Sugerencias de Optimización con IA
                </h4>
              </div>

              {analysis.suggestions.optimizedTitle && analysis.suggestions.optimizedTitle !== product.title && (
                <div className="mb-4">
                  <p className="text-xs font-body text-neutral-600 mb-1">Título optimizado sugerido:</p>
                  <div className="bg-white p-3 rounded-lg border border-purple-200">
                    <p className="text-sm font-body text-neutral-900">
                      {analysis.suggestions.optimizedTitle}
                    </p>
                  </div>
                </div>
              )}

              {analysis.suggestions.optimizedDescription && (
                <div className="mb-4">
                  <p className="text-xs font-body text-neutral-600 mb-1">Descripción optimizada (lista para usar):</p>
                  <div className="bg-white p-4 rounded-lg border border-purple-200 max-h-64 overflow-y-auto">
                    <p className="text-sm font-body text-neutral-900 whitespace-pre-wrap">
                      {analysis.suggestions.optimizedDescription}
                    </p>
                  </div>
                  {analysis.suggestions.descriptionImprovements && analysis.suggestions.descriptionImprovements.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-body text-neutral-500 mb-1">Cambios realizados:</p>
                      <ul className="space-y-1">
                        {analysis.suggestions.descriptionImprovements.map((improvement: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-xs font-body text-neutral-600">
                            <span className="text-purple-500">•</span>
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {analysis.overallScore && (
                <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-purple-200">
                  <span className="text-sm font-body text-neutral-600">Score de optimización:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                        style={{ width: `${(analysis.overallScore / 10) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-lg font-sans font-bold text-primary-700">
                      {analysis.overallScore}/10
                    </span>
                  </div>
                </div>
              )}

              {analysis.summary && (
                <div className="mt-3 text-xs font-body text-neutral-600 bg-white p-3 rounded-lg border border-purple-100">
                  {analysis.summary}
                </div>
              )}
            </div>
          )}

          {/* Análisis de Competidores */}
          {competitors.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">📊</span>
                <h4 className="text-lg font-sans font-semibold text-blue-900">
                  Productos Similares Exitosos
                </h4>
                <Badge variant="info" className="text-xs">
                  Top {competitors.length}
                </Badge>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {competitors.slice(0, 5).map((comp: any, idx: number) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-blue-100 hover:border-blue-300 transition-colors">
                    <div className="flex gap-3">
                      {comp.thumbnail && (
                        <img
                          src={comp.thumbnail}
                          alt={comp.title}
                          className="w-16 h-16 object-cover rounded border border-neutral-200"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-body text-neutral-900 mb-1 line-clamp-2">
                          {comp.title}
                        </p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-green-600 font-semibold">
                            ${comp.price?.toLocaleString('es-AR')}
                          </span>
                          <span className="text-neutral-600">
                            Vendidos: <span className="font-semibold text-primary-700">{comp.sold_quantity || 0}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadatos */}
          <div className="text-xs font-body text-neutral-500 space-y-1 bg-neutral-50 p-3 rounded-lg">
            <p>Categoría: {product.category_id || 'N/A'}</p>
            <p>Última sincronización: {product.last_sync_at ? new Date(product.last_sync_at).toLocaleString('es-AR') : 'N/A'}</p>
            <p>Creado: {new Date(product.created_at).toLocaleString('es-AR')}</p>
            <p>Actualizado: {new Date(product.updated_at).toLocaleString('es-AR')}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
