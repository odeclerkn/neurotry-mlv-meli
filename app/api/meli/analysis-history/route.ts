import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: Obtener histórico de análisis de un producto
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const meliProductId = searchParams.get('product_id')

    if (!meliProductId) {
      return NextResponse.json(
        { error: 'product_id is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Buscar el producto
    const { data: product, error: productError } = await supabase
      .from('meli_products')
      .select('id')
      .eq('meli_product_id', meliProductId)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Obtener todo el histórico de análisis, ordenado por fecha descendente (más reciente primero)
    const { data: history, error: historyError } = await supabase
      .from('product_ai_analysis_history')
      .select('*')
      .eq('product_id', product.id)
      .order('analyzed_at', { ascending: false })

    if (historyError) {
      console.error('Error obteniendo histórico:', historyError)
      return NextResponse.json(
        { error: 'Error fetching history' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: history?.length || 0,
      history: history || []
    })
  } catch (error) {
    console.error('Error in GET /api/meli/analysis-history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
