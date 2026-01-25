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
  const [keywordsSource, setKeywordsSource] = useState<string>('')

  useEffect(() => {
    if (isOpen && product?.category_id) {
      fetchKeywords()
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
    setKeywordsSource('')
    try {
      const response = await fetch(`/api/meli/trending-keywords?category_id=${product.category_id}`)
      console.log('Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Keywords recibidos:', data)
        setKeywords(data.keywords || [])
        setKeywordsSource(data.source || '')
      } else {
        console.error('Response no OK:', response.status)
      }
    } catch (error) {
      console.error('Error fetching keywords:', error)
    } finally {
      setLoadingKeywords(false)
    }
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

          {/* Keywords Trending */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-sans font-semibold text-primary-900">
                Keywords Trending de la Categoría
              </h4>
              {keywordsSource && keywords.length > 0 && (
                <Badge variant="info" className="text-xs">
                  {keywordsSource === 'trends' ? 'De API Trends' : 'De productos más vendidos'}
                </Badge>
              )}
            </div>
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
              <div className="mb-2">
                <p className="text-xs font-body text-neutral-500">
                  Categoría: {product.category_id}
                </p>
              </div>
            ) && (
              <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {keywords.map((kw, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white p-3 rounded-lg border border-neutral-200 hover:border-primary-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-sans font-bold text-sm">
                          {index + 1}
                        </div>
                        <span className="font-body text-sm text-neutral-900">
                          {kw.keyword}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-xs font-body text-neutral-600">
                          {keywordsSource === 'products' ? (
                            <span>{kw.searches} menciones</span>
                          ) : (
                            <span className="text-primary-700 font-semibold">Trending</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
