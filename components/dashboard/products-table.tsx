'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { ProductDetailModal } from './product-detail-modal'

interface ProductsTableProps {
  products: any[]
}

export function ProductsTable({ products }: ProductsTableProps) {
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-neutral-200 bg-neutral-50">
              <th className="text-left p-3 font-sans font-semibold text-sm text-neutral-700"></th>
              <th className="text-left p-3 font-sans font-semibold text-sm text-neutral-700">Título</th>
              <th className="text-left p-3 font-sans font-semibold text-sm text-neutral-700">Descripción</th>
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
                onClick={() => setSelectedProduct(product)}
                className={`border-b border-neutral-200 hover:bg-primary-50 transition-colors cursor-pointer ${
                  index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'
                }`}
              >
                <td className="p-3 w-20">
                  <div className="relative">
                    {product.thumbnail && (
                      <img
                        src={product.thumbnail}
                        alt={product.title}
                        className="w-16 h-16 object-cover rounded-lg border border-neutral-200"
                      />
                    )}
                    {product.is_new && (
                      <div className="absolute -top-1 -right-1 flex items-center gap-1 bg-green-500 text-white text-[10px] font-sans font-bold px-1.5 py-0.5 rounded-full shadow-md">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                        NEW
                      </div>
                    )}
                    {product.is_updated && !product.is_new && (
                      <div className="absolute -top-1 -right-1 flex items-center gap-1 bg-blue-500 text-white text-[10px] font-sans font-bold px-1.5 py-0.5 rounded-full shadow-md">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                        UPD
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-3 font-body text-sm text-neutral-900 max-w-xs">
                  <div className="line-clamp-2">
                    {product.title}
                  </div>
                </td>
                <td className="p-3 font-body text-xs text-neutral-600 max-w-sm">
                  <div className="line-clamp-2">
                    {product.description || 'Sin descripción'}
                  </div>
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

      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </>
  )
}
