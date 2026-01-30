'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ProductAnalysisViewProps {
  product: any
}

export function ProductAnalysisView({ product }: ProductAnalysisViewProps) {
  const router = useRouter()
  const [keywords, setKeywords] = useState<any[]>([])
  const [loadingKeywords, setLoadingKeywords] = useState(true)
  const [competitors, setCompetitors] = useState<any[]>([])
  const [commercialAnalysis, setCommercialAnalysis] = useState<any>(null)
  const [paymentAnalysis, setPaymentAnalysis] = useState<any>(null)
  const [shippingAnalysis, setShippingAnalysis] = useState<any>(null)
  const [frequentQuestions, setFrequentQuestions] = useState<any>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [deletingAnalysis, setDeletingAnalysis] = useState(false)
  const [aiProvider, setAiProvider] = useState<string>('')
  const [analyzedAt, setAnalyzedAt] = useState<string>('')
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    if (product.category_id) {
      fetchKeywords()
    }
    if (product.meli_product_id) {
      fetchCompetitors()
      fetchSavedAnalysis()
      fetchAnalysisHistory()
    }
  }

  const fetchKeywords = async () => {
    setLoadingKeywords(true)
    try {
      const response = await fetch(
        `/api/meli/trending-keywords?category_id=${product.category_id}&product_id=${product.meli_product_id}`
      )
      if (response.ok) {
        const data = await response.json()
        if (data.basicAnalysis) {
          const keywordsWithAnalysis = data.keywords.map((kw: any, idx: number) => ({
            ...kw,
            basicAnalysis: data.basicAnalysis[idx]
          }))
          setKeywords(keywordsWithAnalysis)
        } else {
          setKeywords(data.keywords || [])
        }
      }
    } catch (error) {
      console.error('Error fetching keywords:', error)
    } finally {
      setLoadingKeywords(false)
    }
  }

  const fetchCompetitors = async () => {
    try {
      console.log('🔍 Fetching competitors for:', product.meli_product_id)
      const response = await fetch(`/api/meli/similar-products?product_id=${product.meli_product_id}`)
      console.log('📡 Response status:', response.status, response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log('📦 Full response data:', data)

        setCompetitors(data.competitors || [])
        setCommercialAnalysis(data.analysis?.commercial)
        setPaymentAnalysis(data.analysis?.payment)
        setShippingAnalysis(data.analysis?.shipping)
        setFrequentQuestions(data.analysis?.frequentQuestions)

        console.log('📊 Análisis recibido:', {
          commercial: !!data.analysis?.commercial,
          payment: !!data.analysis?.payment,
          shipping: !!data.analysis?.shipping,
          questions: data.analysis?.frequentQuestions?.totalQuestions || 0
        })

        console.log('💳 Payment Analysis:', data.analysis?.payment)
        console.log('🚚 Shipping Analysis:', data.analysis?.shipping)
        console.log('❓ Frequent Questions:', data.analysis?.frequentQuestions)
      } else {
        console.error('❌ Response not OK:', response.status)
      }
    } catch (error) {
      console.error('❌ Error fetching competitors:', error)
    }
  }

  const fetchSavedAnalysis = async () => {
    try {
      const response = await fetch(`/api/meli/analyze-listing?product_id=${product.meli_product_id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.hasAnalysis) {
          setAnalysis(data.analysis)
          setAiProvider(data.provider || 'unknown')
          setAnalyzedAt(data.analyzedAt || '')
        }
      }
    } catch (error) {
      console.error('Error fetching saved analysis:', error)
    }
  }

  const fetchAnalysisHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await fetch(`/api/meli/analysis-history?product_id=${product.meli_product_id}`)
      if (response.ok) {
        const data = await response.json()
        setAnalysisHistory(data.history || [])
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleAnalyze = async () => {
    if (!product?.meli_product_id || keywords.length === 0) return

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
        setAnalysis(data.analysis)
        setAiProvider(data.provider || 'unknown')
        setAnalyzedAt(new Date().toISOString())
        fetchAnalysisHistory()
      }
    } catch (error) {
      console.error('Error analyzing:', error)
    } finally {
      setLoadingAnalysis(false)
    }
  }

  const handleDeleteClick = () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }
    executeDelete()
  }

  const executeDelete = async () => {
    if (!product?.meli_product_id) return

    setDeletingAnalysis(true)
    try {
      const response = await fetch(`/api/meli/analyze-listing?product_id=${product.meli_product_id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAnalysis(null)
        setAiProvider('')
        setAnalyzedAt('')
        setShowDeleteConfirm(false)
        await fetchAnalysisHistory()
      } else {
        const errorData = await response.json()
        alert(`Error al eliminar: ${errorData.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error deleting analysis:', error)
      alert('Error al eliminar el análisis.')
    } finally {
      setDeletingAnalysis(false)
    }
  }

  const handleRestoreClick = (historyId: string) => {
    if (showRestoreConfirm !== historyId) {
      setShowRestoreConfirm(historyId)
      return
    }
    executeRestore(historyId)
  }

  const executeRestore = async (historyId: string) => {
    if (!product?.meli_product_id) return

    setRestoringId(historyId)
    try {
      const response = await fetch('/api/meli/analyze-listing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history_id: historyId,
          product_id: product.meli_product_id
        })
      })

      if (response.ok) {
        setShowRestoreConfirm(null)
        await fetchSavedAnalysis()
        await fetchAnalysisHistory()
      } else {
        const errorData = await response.json()
        alert(`Error al restaurar: ${errorData.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error restoring analysis:', error)
      alert('Error al restaurar el análisis')
    } finally {
      setRestoringId(null)
    }
  }

  const isKeywordUsed = (keyword: string): boolean => {
    const normalizedKeyword = keyword.toLowerCase().trim()
    const title = (product.title || '').toLowerCase()
    const description = (product.description || '').toLowerCase()
    return title.includes(normalizedKeyword) || description.includes(normalizedKeyword)
  }

  const getKeywordAnalysis = (keyword: string) => {
    if (!analysis?.keywordAnalysis) return null
    return analysis.keywordAnalysis.find((ka: any) => ka.keyword.toLowerCase() === keyword.toLowerCase())
  }

  const commercialRecommendations = analysis?.suggestions?.commercialRecommendations || null

  return (
    <div className="space-y-6">
      {/* Header del Producto */}
      <Card className="border-2 border-primary-200">
        <CardHeader>
          <div className="flex items-start gap-6">
            {product.thumbnail && (
              <div className="relative">
                <img
                  src={product.thumbnail}
                  alt={product.title}
                  className="w-48 h-48 object-cover rounded-xl border-2 border-neutral-200 shadow-sm"
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
              <CardTitle className="text-2xl text-primary-900 mb-4">{product.title}</CardTitle>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className="font-body text-sm">
                  ${product.price?.toLocaleString('es-AR')}
                </Badge>
                <Badge variant="outline" className="font-body text-sm">
                  Stock: {product.available_quantity || 0}
                </Badge>
                <Badge variant="outline" className="font-body text-sm">
                  Vendidos: {product.sold_quantity || 0}
                </Badge>
                <Badge
                  variant={product.status === 'active' ? 'success' : 'secondary'}
                  className="text-sm"
                >
                  {product.status}
                </Badge>
                {analysis?.overallScore && (
                  <Badge className="bg-primary-600 font-body text-sm">
                    Score: {analysis.overallScore}/10
                  </Badge>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-body text-neutral-600">ID MELI:</span>
                  <span className="font-mono text-neutral-900">{product.meli_product_id}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-body text-neutral-600">Tipo de anuncio:</span>
                  <span className="font-sans font-semibold text-neutral-900">
                    {(() => {
                      const type = product.listing_type_id?.toLowerCase() || ''
                      if (type.includes('gold')) return '⭐ Premium (Gold)'
                      if (type.includes('silver')) return '💎 Destacado (Silver)'
                      if (type.includes('bronze')) return '🥉 Bronce'
                      if (type.includes('free')) return '📢 Gratuito'
                      return product.listing_type_id || 'N/A'
                    })()}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleAnalyze}
                  disabled={loadingAnalysis || deletingAnalysis || keywords.length === 0}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors font-sans font-semibold text-sm"
                >
                  {loadingAnalysis ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Analizando...
                    </span>
                  ) : analysis ? (
                    '🔄 Re-analizar con IA'
                  ) : (
                    '🤖 Analizar con IA'
                  )}
                </button>

                {analysis && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDeleteClick}
                      disabled={loadingAnalysis || deletingAnalysis}
                      className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 transition-all font-sans font-semibold text-sm ${
                        showDeleteConfirm
                          ? 'bg-red-700 hover:bg-red-800 animate-pulse'
                          : 'bg-red-500 hover:bg-red-600'
                      }`}
                    >
                      {deletingAnalysis ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Eliminando...
                        </span>
                      ) : showDeleteConfirm ? (
                        '⚠️ ¿Confirmar eliminación?'
                      ) : (
                        '🗑️ Borrar análisis'
                      )}
                    </button>
                    {showDeleteConfirm && !deletingAnalysis && (
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3 py-2 bg-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-400 transition-colors font-sans font-semibold text-sm"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                )}

                {aiProvider && analysis && (
                  <div className="flex items-center gap-2 ml-auto">
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
          </div>
        </CardHeader>
      </Card>

      {/* Descripción */}
      {product.description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📝</span>
              Descripción Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-body text-neutral-700 whitespace-pre-wrap bg-neutral-50 p-4 rounded-lg border border-neutral-200">
              {product.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Keywords Trending */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🔑</span>
            Keywords Trending
          </CardTitle>
          <CardDescription>
            Palabras clave más buscadas en tu categoría. El score indica qué tan relevante es cada keyword para tu producto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingKeywords ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : keywords.length > 0 ? (
            <>
              {/* Leyenda */}
              <div className="mb-4 p-3 bg-neutral-50 rounded-lg flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="font-body text-neutral-600">Relevante y utilizado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="font-body text-neutral-600">Relevante pero no utilizado (oportunidad)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="font-body text-neutral-600">No relevante</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <span className="font-body text-neutral-600">Sin validar</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {keywords.map((kw, index) => {
                  const isUsed = isKeywordUsed(kw.keyword)
                  const kwAnalysis = getKeywordAnalysis(kw.keyword)
                  const basicAnalysis = kw.basicAnalysis

                  let statusColor = 'bg-gray-400'
                  let borderColor = 'border-gray-200'
                  let statusText = 'Sin validar'

                  if (kwAnalysis) {
                    if (kwAnalysis.isRelevant && isUsed) {
                      statusColor = 'bg-green-500'
                      borderColor = 'border-green-200'
                      statusText = `✅ Usado (${kwAnalysis.score}/10)`
                    } else if (kwAnalysis.isRelevant && !isUsed) {
                      statusColor = 'bg-yellow-500'
                      borderColor = 'border-yellow-200'
                      statusText = `⚠️ Oportunidad (${kwAnalysis.score}/10)`
                    } else {
                      statusColor = 'bg-red-500'
                      borderColor = 'border-red-200'
                      statusText = `❌ No relevante (${kwAnalysis.score}/10)`
                    }
                  } else if (basicAnalysis && basicAnalysis.status === 'used') {
                    statusColor = 'bg-green-400'
                    borderColor = 'border-green-200'
                    statusText = '✓ Detectado'
                  }

                  return (
                    <div
                      key={index}
                      className={`p-3 border-2 ${borderColor} rounded-lg hover:shadow-sm transition-shadow`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-3 h-3 rounded-full ${statusColor} flex-shrink-0 mt-1`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="font-sans font-semibold text-sm text-neutral-900 truncate">
                            {kw.keyword}
                          </div>
                          <div className="text-xs font-body text-neutral-600 mt-1">
                            {statusText}
                          </div>
                          {kwAnalysis && (
                            <div className="text-xs font-body text-neutral-500 mt-1 line-clamp-2">
                              {kwAnalysis.reason}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <Alert variant="info">
              <AlertDescription>
                No se encontraron keywords trending para esta categoría.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Análisis Comercial de Competidores */}
      {commercialAnalysis && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📊</span>
              Análisis Comercial vs Competidores
            </CardTitle>
            <CardDescription>
              Comparativa con los top productos más vendidos de tu categoría
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Envío */}
            <div>
              <h3 className="font-sans font-bold text-neutral-900 mb-3 flex items-center gap-2">
                <span>🚚</span> Envío y Logística
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="text-2xl font-sans font-bold text-blue-600">
                    {commercialAnalysis.shipping.freeShipping.percentage}%
                  </div>
                  <div className="text-sm font-body text-neutral-700 mt-1">
                    Envío gratis
                  </div>
                  <div className="text-xs font-body text-neutral-500 mt-1">
                    {commercialAnalysis.shipping.freeShipping.count} de {competitors.length}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="text-2xl font-sans font-bold text-blue-600">
                    {commercialAnalysis.shipping.fullFulfillment.percentage}%
                  </div>
                  <div className="text-sm font-body text-neutral-700 mt-1">
                    Mercado Envíos Full
                  </div>
                  <div className="text-xs font-body text-neutral-500 mt-1">
                    {commercialAnalysis.shipping.fullFulfillment.count} de {competitors.length}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="text-2xl font-sans font-bold text-blue-600">
                    {commercialAnalysis.shipping.flexFulfillment.percentage}%
                  </div>
                  <div className="text-sm font-body text-neutral-700 mt-1">
                    Mercado Envíos Flex
                  </div>
                  <div className="text-xs font-body text-neutral-500 mt-1">
                    {commercialAnalysis.shipping.flexFulfillment.count} de {competitors.length}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="text-2xl font-sans font-bold text-blue-600">
                    {commercialAnalysis.shipping.storePickup.percentage}%
                  </div>
                  <div className="text-sm font-body text-neutral-700 mt-1">
                    Retiro en tienda
                  </div>
                  <div className="text-xs font-body text-neutral-500 mt-1">
                    {commercialAnalysis.shipping.storePickup.count} de {competitors.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Financiación */}
            <div>
              <h3 className="font-sans font-bold text-neutral-900 mb-3 flex items-center gap-2">
                <span>💳</span> Financiación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="text-2xl font-sans font-bold text-blue-600">
                    {commercialAnalysis.financing.withInstallments.percentage}%
                  </div>
                  <div className="text-sm font-body text-neutral-700 mt-1">
                    Ofrece cuotas
                  </div>
                  <div className="text-xs font-body text-neutral-500 mt-1">
                    {commercialAnalysis.financing.withInstallments.count} de {competitors.length}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="text-2xl font-sans font-bold text-blue-600">
                    {commercialAnalysis.financing.averageMaxInstallments}
                  </div>
                  <div className="text-sm font-body text-neutral-700 mt-1">
                    Cuotas promedio
                  </div>
                  <div className="text-xs font-body text-neutral-500 mt-1">
                    Máximo ofrecido
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="text-2xl font-sans font-bold text-blue-600">
                    {commercialAnalysis.financing.interestFree.percentage}%
                  </div>
                  <div className="text-sm font-body text-neutral-700 mt-1">
                    Sin interés
                  </div>
                  <div className="text-xs font-body text-neutral-500 mt-1">
                    {commercialAnalysis.financing.interestFree.count} de {commercialAnalysis.financing.withInstallments.count}
                  </div>
                </div>
              </div>
            </div>

            {/* Tipo de Publicación */}
            <div>
              <h3 className="font-sans font-bold text-neutral-900 mb-3 flex items-center gap-2">
                <span>📢</span> Tipo de Publicación
              </h3>
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <div className="text-lg font-sans font-bold text-blue-600">
                  {commercialAnalysis.listingType.mostCommon || 'N/A'}
                </div>
                <div className="text-sm font-body text-neutral-700 mt-1">
                  Tipo más común: {commercialAnalysis.listingType.mostCommonPercentage}% lo usa
                </div>
                <div className="text-xs font-body text-neutral-500 mt-1">
                  {commercialAnalysis.listingType.mostCommonCount} de {competitors.length} competidores
                </div>
              </div>
            </div>

            {/* Garantía y Reputación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-sans font-bold text-neutral-900 mb-3 flex items-center gap-2">
                  <span>🛡️</span> Garantía
                </h3>
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="text-2xl font-sans font-bold text-blue-600">
                    {commercialAnalysis.warranty.percentage}%
                  </div>
                  <div className="text-sm font-body text-neutral-700 mt-1">
                    Ofrece garantía
                  </div>
                  <div className="text-xs font-body text-neutral-500 mt-1">
                    {commercialAnalysis.warranty.count} de {competitors.length}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-sans font-bold text-neutral-900 mb-3 flex items-center gap-2">
                  <span>⭐</span> Reputación
                </h3>
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="text-2xl font-sans font-bold text-blue-600">
                    {commercialAnalysis.reputation.platinum.percentage}%
                  </div>
                  <div className="text-sm font-body text-neutral-700 mt-1">
                    MercadoLíder Platinum
                  </div>
                  <div className="text-xs font-body text-neutral-500 mt-1">
                    {commercialAnalysis.reputation.platinum.count} de {competitors.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Recomendaciones de la IA */}
            {commercialRecommendations && (
              <div className="mt-6">
                <h3 className="font-sans font-bold text-neutral-900 mb-3 flex items-center gap-2">
                  <span>💡</span> Recomendaciones de IA
                </h3>
                <div className="space-y-3">
                  {Object.entries(commercialRecommendations).map(([key, rec]: [string, any]) => {
                    const priorityColors = {
                      high: 'border-red-300 bg-red-50',
                      medium: 'border-yellow-300 bg-yellow-50',
                      low: 'border-blue-300 bg-blue-50'
                    }
                    const priorityLabels = {
                      high: '🔴 Alta Prioridad',
                      medium: '🟡 Prioridad Media',
                      low: '🔵 Prioridad Baja'
                    }

                    return (
                      <div
                        key={key}
                        className={`p-4 border-2 rounded-lg ${priorityColors[rec.priority as keyof typeof priorityColors] || 'border-gray-300 bg-gray-50'}`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="font-sans font-bold text-neutral-900 capitalize">
                            {key === 'shipping' && '🚚 Envío'}
                            {key === 'financing' && '💳 Financiación'}
                            {key === 'listingType' && '📢 Publicación'}
                            {key === 'warranty' && '🛡️ Garantía'}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {priorityLabels[rec.priority as keyof typeof priorityLabels]}
                          </Badge>
                        </div>
                        <div className="text-sm font-body text-neutral-900 font-semibold mb-1">
                          {rec.recommendation}
                        </div>
                        <div className="text-xs font-body text-neutral-600">
                          {rec.reason}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recomendaciones de Formas de Pago */}
      {paymentAnalysis && paymentAnalysis.recommendation && (
        <Card className={`border-2 ${
          paymentAnalysis.priority === 'high' ? 'border-red-300 bg-red-50' :
          paymentAnalysis.priority === 'medium' ? 'border-yellow-300 bg-yellow-50' :
          'border-green-300 bg-green-50'
        }`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span>💳</span>
                Optimización de Formas de Pago
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {paymentAnalysis.priority === 'high' && '🔴 Alta Prioridad'}
                {paymentAnalysis.priority === 'medium' && '🟡 Prioridad Media'}
                {paymentAnalysis.priority === 'low' && '🟢 Bien Configurado'}
              </Badge>
            </div>
            <CardDescription>
              Análisis basado en competidores exitosos de tu categoría
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-neutral-200">
              <h3 className="font-sans font-bold text-neutral-900 mb-2">
                Recomendación:
              </h3>
              <p className="text-base font-body text-neutral-900 mb-3">
                {paymentAnalysis.recommendation}
              </p>
              <p className="text-sm font-body text-neutral-600">
                <span className="font-semibold">Razón:</span> {paymentAnalysis.reason}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-neutral-200">
                <h4 className="font-sans font-bold text-neutral-700 mb-3">Tu Configuración Actual</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-body text-neutral-600">Cuotas:</span>
                    <span className="text-sm font-semibold text-neutral-900">
                      {paymentAnalysis.currentStatus.installments || 'No configurado'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-body text-neutral-600">Sin interés:</span>
                    <span className="text-sm font-semibold text-neutral-900">
                      {paymentAnalysis.currentStatus.interestFree ? '✓ Sí' : '✗ No'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-neutral-200">
                <h4 className="font-sans font-bold text-neutral-700 mb-3">Promedio del Mercado</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-body text-neutral-600">Cuotas comunes:</span>
                    <span className="text-sm font-semibold text-neutral-900">
                      {paymentAnalysis.marketAverage.mostCommon}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-body text-neutral-600">Con sin interés:</span>
                    <span className="text-sm font-semibold text-neutral-900">
                      {paymentAnalysis.marketAverage.interestFreePercentage}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recomendaciones de Envío */}
      {shippingAnalysis && shippingAnalysis.recommendation && (
        <Card className={`border-2 ${
          shippingAnalysis.priority === 'high' ? 'border-red-300 bg-red-50' :
          shippingAnalysis.priority === 'medium' ? 'border-yellow-300 bg-yellow-50' :
          'border-green-300 bg-green-50'
        }`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span>🚚</span>
                Optimización de Envío
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {shippingAnalysis.priority === 'high' && '🔴 Alta Prioridad'}
                {shippingAnalysis.priority === 'medium' && '🟡 Prioridad Media'}
                {shippingAnalysis.priority === 'low' && '🟢 Bien Configurado'}
              </Badge>
            </div>
            <CardDescription>
              Análisis basado en competidores exitosos de tu categoría
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-neutral-200">
              <h3 className="font-sans font-bold text-neutral-900 mb-2">
                Recomendación:
              </h3>
              <p className="text-base font-body text-neutral-900 mb-3">
                {shippingAnalysis.recommendation}
              </p>
              <p className="text-sm font-body text-neutral-600">
                <span className="font-semibold">Razón:</span> {shippingAnalysis.reason}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-neutral-200">
                <h4 className="font-sans font-bold text-neutral-700 mb-3">Tu Configuración Actual</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-body text-neutral-600">Envío gratis:</span>
                    <span className="text-sm font-semibold text-neutral-900">
                      {shippingAnalysis.currentStatus.freeShipping ? '✓ Sí' : '✗ No'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-body text-neutral-600">Modalidad:</span>
                    <span className="text-sm font-semibold text-neutral-900">
                      {shippingAnalysis.currentStatus.fulfillmentMode === 'me2' ? 'Full' :
                       shippingAnalysis.currentStatus.fulfillmentMode === 'me1' ? 'Flex' : 'Estándar'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-neutral-200">
                <h4 className="font-sans font-bold text-neutral-700 mb-3">Estadísticas del Mercado</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-body text-neutral-600">Envío gratis:</span>
                    <span className="text-sm font-semibold text-neutral-900">
                      {shippingAnalysis.marketStats.freeShippingPercentage}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-body text-neutral-600">Usan Full:</span>
                    <span className="text-sm font-semibold text-neutral-900">
                      {shippingAnalysis.marketStats.fullPercentage}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preguntas Frecuentes de Usuarios */}
      {frequentQuestions && frequentQuestions.totalQuestions > 0 && (
        <Card className="border-2 border-indigo-200 bg-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>❓</span>
              Preguntas Frecuentes de Compradores
            </CardTitle>
            <CardDescription>
              Analizado de {frequentQuestions.totalQuestions} preguntas reales de competidores exitosos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recomendaciones principales */}
            {frequentQuestions.recommendations && frequentQuestions.recommendations.length > 0 && (
              <div className="bg-yellow-50 border-2 border-yellow-300 p-4 rounded-lg">
                <h3 className="font-sans font-bold text-yellow-900 mb-3 flex items-center gap-2">
                  <span>💡</span>
                  Recomendaciones para tu Publicación
                </h3>
                <ul className="space-y-2">
                  {frequentQuestions.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm font-body text-yellow-900">
                      <span className="text-yellow-600 font-bold">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tópicos más frecuentes */}
            <div>
              <h3 className="font-sans font-bold text-neutral-900 mb-3">
                Temas Más Preguntados
              </h3>
              <div className="space-y-3">
                {frequentQuestions.commonTopics.slice(0, 5).map((topic: any, idx: number) => (
                  <div key={idx} className="bg-white p-4 rounded-lg border border-indigo-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-sans font-bold text-neutral-900 capitalize">
                        {topic.topic === 'medidas' && '📏 Medidas y Dimensiones'}
                        {topic.topic === 'material' && '🧵 Material y Calidad'}
                        {topic.topic === 'compatibilidad' && '🔌 Compatibilidad'}
                        {topic.topic === 'stock' && '📦 Stock y Disponibilidad'}
                        {topic.topic === 'envío' && '🚚 Envío y Entrega'}
                        {topic.topic === 'garantía' && '🛡️ Garantía'}
                        {topic.topic === 'original' && '✨ Originalidad'}
                        {topic.topic === 'color' && '🎨 Color'}
                        {topic.topic === 'precio' && '💰 Precio'}
                        {!['medidas', 'material', 'compatibilidad', 'stock', 'envío', 'garantía', 'original', 'color', 'precio'].includes(topic.topic) && topic.topic}
                      </h4>
                      <Badge variant="default" className="bg-indigo-600 text-xs">
                        {topic.percentage}% de preguntas
                      </Badge>
                    </div>
                    <p className="text-sm font-body text-neutral-600 mb-2">
                      {topic.count} preguntas sobre este tema
                    </p>
                    {topic.examples && topic.examples.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-indigo-100">
                        <p className="text-xs font-body text-neutral-500 mb-2">Ejemplos:</p>
                        <ul className="space-y-1">
                          {topic.examples.slice(0, 2).map((example: string, exIdx: number) => (
                            <li key={exIdx} className="text-xs font-body text-neutral-700 italic flex items-start gap-2">
                              <span className="text-indigo-400">→</span>
                              <span>"{example}"</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sugerencias de IA */}
      {analysis?.suggestions && (
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <CardTitle>Sugerencias de Optimización con IA</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Título sugerido */}
            {analysis.suggestions.optimizedTitle && analysis.suggestions.optimizedTitle !== product.title && (
              <div>
                <h5 className="text-sm font-sans font-bold text-purple-900 mb-3">Comparación de Títulos</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-body text-neutral-500 mb-2 flex items-center gap-1">
                      <span className="text-red-500">✗</span> Título Actual
                    </p>
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                      <p className="text-sm font-body text-neutral-900">
                        {product.title}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-body text-neutral-500 mb-2 flex items-center gap-1">
                      <span className="text-green-500">✓</span> Título Optimizado Sugerido
                    </p>
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <p className="text-sm font-body text-neutral-900">
                        {analysis.suggestions.optimizedTitle}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Descripción sugerida */}
            {analysis.suggestions.optimizedDescription && (
              <div>
                <h5 className="text-sm font-sans font-bold text-purple-900 mb-3">Comparación de Descripciones</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-body text-neutral-500 mb-2 flex items-center gap-1">
                      <span className="text-red-500">✗</span> Descripción Actual
                    </p>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200 max-h-64 overflow-y-auto">
                      <p className="text-sm font-body text-neutral-900 whitespace-pre-wrap">
                        {product.description || 'Sin descripción'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-body text-neutral-500 mb-2 flex items-center gap-1">
                      <span className="text-green-500">✓</span> Descripción Optimizada (Lista para usar)
                    </p>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 max-h-64 overflow-y-auto">
                      <p className="text-sm font-body text-neutral-900 whitespace-pre-wrap">
                        {analysis.suggestions.optimizedDescription}
                      </p>
                    </div>
                  </div>
                </div>
                {analysis.suggestions.descriptionImprovements && analysis.suggestions.descriptionImprovements.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-sans font-bold text-blue-900 mb-2">Cambios realizados:</p>
                    <ul className="space-y-1">
                      {analysis.suggestions.descriptionImprovements.map((improvement: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-xs font-body text-blue-900">
                          <span className="text-blue-600">•</span>
                          <span>{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Score y resumen */}
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
          </CardContent>
        </Card>
      )}

      {/* Histórico de Análisis */}
      {analysisHistory.length > 0 && (
        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📜</span>
                <CardTitle>Histórico de Análisis</CardTitle>
                <Badge variant="default" className="bg-amber-600 text-xs">
                  {analysisHistory.length} {analysisHistory.length === 1 ? 'análisis' : 'análisis'}
                </Badge>
              </div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-sm text-amber-700 hover:text-amber-900 font-sans font-semibold"
              >
                {showHistory ? '▼ Ocultar' : '▶ Ver histórico'}
              </button>
            </div>

            {!analysis && analysisHistory.length > 0 && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs font-body text-red-800">
                  ℹ️ El análisis actual fue eliminado. El histórico se mantiene para referencia.
                </p>
              </div>
            )}
          </CardHeader>

          {showHistory && (
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {analysisHistory.map((hist: any, idx: number) => (
                  <div key={hist.id} className="bg-white p-4 rounded-lg border border-amber-100 hover:border-amber-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <span className="text-xs font-body text-neutral-500">
                            {new Date(hist.analyzed_at).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="default" className="text-xs">
                              {hist.ai_provider === 'anthropic' ? 'Claude' :
                               hist.ai_provider === 'openai' ? 'GPT-4' :
                               hist.ai_provider === 'gemini' ? 'Gemini' : 'Básico'}
                            </Badge>
                            <Badge
                              variant={
                                hist.overall_score >= 7 ? 'success' :
                                hist.overall_score >= 4 ? 'warning' : 'destructive'
                              }
                              className="text-xs"
                            >
                              Score: {hist.overall_score}/10
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {idx === 0 && (
                        analysis ? (
                          <Badge variant="default" className="bg-green-600 text-xs">
                            Actual
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-red-500 text-xs">
                            Eliminado
                          </Badge>
                        )
                      )}
                    </div>

                    {hist.summary && (
                      <div className="mt-2">
                        <p className="text-xs font-body text-neutral-600 bg-neutral-50 p-2 rounded">
                          {hist.summary}
                        </p>
                      </div>
                    )}

                    {hist.improvements_explanation && (
                      <div className="mt-2">
                        <p className="text-xs font-body text-neutral-500 mb-1">Explicación de mejoras:</p>
                        <p className="text-xs font-body text-neutral-700 bg-blue-50 p-2 rounded">
                          {hist.improvements_explanation}
                        </p>
                      </div>
                    )}

                    {hist.suggested_title && hist.suggested_title !== product.title && (
                      <div className="mt-2">
                        <p className="text-xs font-body text-neutral-500 mb-1">Título sugerido:</p>
                        <p className="text-xs font-body text-neutral-700 italic">
                          "{hist.suggested_title}"
                        </p>
                      </div>
                    )}

                    {/* Botón de restaurar */}
                    {!(idx === 0 && analysis) && (
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          onClick={() => handleRestoreClick(hist.id)}
                          disabled={restoringId === hist.id}
                          className={`px-3 py-1.5 text-white text-xs font-sans font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ${
                            showRestoreConfirm === hist.id
                              ? 'bg-blue-700 hover:bg-blue-800 animate-pulse'
                              : 'bg-blue-500 hover:bg-blue-600'
                          }`}
                        >
                          {restoringId === hist.id ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Restaurando...
                            </>
                          ) : showRestoreConfirm === hist.id ? (
                            <>
                              ✓ ¿Confirmar restauración?
                            </>
                          ) : (
                            <>
                              ♻️ Restaurar como actual
                            </>
                          )}
                        </button>
                        {showRestoreConfirm === hist.id && restoringId !== hist.id && (
                          <button
                            onClick={() => setShowRestoreConfirm(null)}
                            className="px-2 py-1.5 bg-neutral-300 text-neutral-700 text-xs font-sans font-semibold rounded-lg hover:bg-neutral-400 transition-colors"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {loadingHistory && (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-sm text-amber-700">Cargando histórico...</span>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Productos Similares */}
      {competitors.length > 0 && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <CardTitle>Productos Similares Exitosos</CardTitle>
              <Badge variant="info" className="text-xs">
                Top {competitors.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {competitors.slice(0, 10).map((comp: any, idx: number) => (
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
          </CardContent>
        </Card>
      )}

      {/* Metadatos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Metadatos del Producto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs font-body text-neutral-500 space-y-1 bg-neutral-50 p-3 rounded-lg">
            <p>Categoría: {product.category_id || 'N/A'}</p>
            <p>Última sincronización: {product.last_sync_at ? new Date(product.last_sync_at).toLocaleString('es-AR') : 'N/A'}</p>
            <p>Creado: {new Date(product.created_at).toLocaleString('es-AR')}</p>
            <p>Actualizado: {new Date(product.updated_at).toLocaleString('es-AR')}</p>
          </div>
        </CardContent>
      </Card>

      {!analysis && (
        <Alert>
          <AlertDescription className="font-body">
            Este producto aún no ha sido analizado. Haz click en "Analizar con IA" para generar sugerencias y análisis comercial.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
