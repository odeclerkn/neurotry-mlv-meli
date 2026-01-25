import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveMeliConnection } from '@/lib/meli/tokens'
import { getValidAccessToken } from '@/lib/meli/client'

const MELI_API_URL = 'https://api.mercadolibre.com'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get('product_id')

    if (!productId) {
      return NextResponse.json(
        { error: 'product_id is required' },
        { status: 400 }
      )
    }

    // Obtener access token de la conexión activa
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const activeConnection = await getActiveMeliConnection(user.id)
    if (!activeConnection) {
      return NextResponse.json(
        { error: 'No active MELI connection' },
        { status: 404 }
      )
    }

    const accessToken = await getValidAccessToken(activeConnection.id)

    console.log(`========================================`)
    console.log(`Buscando productos similares para: ${productId}`)

    // 1. Obtener información completa del producto (con atributos)
    const productResponse = await fetch(`${MELI_API_URL}/items/${productId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!productResponse.ok) {
      console.error(`Error obteniendo producto: ${productResponse.status}`)
      return NextResponse.json(
        { error: 'Error fetching product details' },
        { status: productResponse.status }
      )
    }

    const productData = await productResponse.json()
    console.log(`Producto: ${productData.title}`)
    console.log(`Atributos encontrados: ${productData.attributes?.length || 0}`)

    // 2. Extraer atributos clave para la búsqueda
    const attributes = productData.attributes || []
    const brand = attributes.find((attr: any) => attr.id === 'BRAND')?.value_name
    const model = attributes.find((attr: any) => attr.id === 'MODEL')?.value_name
    const categoryId = productData.category_id

    console.log(`Brand: ${brand}, Model: ${model}, Category: ${categoryId}`)

    // 3. Construir query de búsqueda para productos similares
    let searchQuery = ''

    if (brand && model) {
      searchQuery = `${brand} ${model}`
    } else if (brand) {
      searchQuery = brand
    } else {
      // Si no hay marca/modelo, usar palabras clave del título
      const titleWords = productData.title
        .split(' ')
        .filter((word: string) => word.length > 3)
        .slice(0, 3)
        .join(' ')
      searchQuery = titleWords
    }

    console.log(`Search query: ${searchQuery}`)

    // 4. Buscar productos similares exitosos (ordenados por ventas)
    const searchUrl = `${MELI_API_URL}/sites/MLA/search?` + new URLSearchParams({
      q: searchQuery,
      category: categoryId,
      limit: '30',
      sort: 'sold_quantity_desc',
      ...(brand && { 'BRAND': brand })
    }).toString()

    console.log(`Buscando en: ${searchUrl}`)

    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!searchResponse.ok) {
      console.error(`Error en búsqueda: ${searchResponse.status}`)
      return NextResponse.json({ competitors: [], product: productData })
    }

    const searchData = await searchResponse.json()
    console.log(`Productos similares encontrados: ${searchData.results?.length || 0}`)

    // 5. Filtrar y analizar competidores
    const competitors = searchData.results
      ?.filter((item: any) => item.id !== productId) // Excluir el mismo producto
      ?.slice(0, 10) // Top 10 competidores
      ?.map((item: any) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        sold_quantity: item.sold_quantity || 0,
        available_quantity: item.available_quantity,
        thumbnail: item.thumbnail,
        permalink: item.permalink,
        condition: item.condition,
        listing_type_id: item.listing_type_id
      })) || []

    // 6. Analizar patrones en títulos de competidores exitosos
    const titlePatterns = analyzeTitlePatterns(competitors)

    // 7. Extraer keywords comunes de competidores exitosos
    const commonKeywords = extractCommonKeywords(competitors, productData.title)

    console.log(`Top keywords de competidores:`, commonKeywords.slice(0, 5))
    console.log(`========================================`)

    return NextResponse.json({
      product: {
        id: productData.id,
        title: productData.title,
        price: productData.price,
        sold_quantity: productData.sold_quantity || 0,
        attributes: productData.attributes
      },
      competitors,
      analysis: {
        titlePatterns,
        commonKeywords,
        averagePrice: competitors.reduce((sum: number, c: any) => sum + c.price, 0) / competitors.length || 0,
        averageSoldQuantity: competitors.reduce((sum: number, c: any) => sum + c.sold_quantity, 0) / competitors.length || 0,
        totalCompetitors: competitors.length
      }
    })
  } catch (error) {
    console.error('Error in /api/meli/similar-products:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Analizar patrones en títulos de competidores
function analyzeTitlePatterns(competitors: any[]): any {
  if (competitors.length === 0) return {}

  const avgTitleLength = competitors.reduce((sum, c) => sum + c.title.length, 0) / competitors.length
  const avgWords = competitors.reduce((sum, c) => sum + c.title.split(' ').length, 0) / competitors.length

  return {
    averageTitleLength: Math.round(avgTitleLength),
    averageWordCount: Math.round(avgWords),
    mostCommonFormat: 'MARCA MODELO ATRIBUTOS' // Simplificado por ahora
  }
}

// Extraer keywords comunes que aparecen en títulos de competidores exitosos
function extractCommonKeywords(competitors: any[], currentTitle: string): any[] {
  const keywordMap = new Map<string, number>()

  competitors.forEach((competitor) => {
    const words = competitor.title
      .toLowerCase()
      .split(/[\s\-\/]+/)
      .filter((w: string) => w.length > 2) // Palabras de más de 2 caracteres
      .filter((w: string) => !/^\d+$/.test(w)) // Excluir solo números

    words.forEach((word: string) => {
      keywordMap.set(word, (keywordMap.get(word) || 0) + 1)
    })
  })

  // Convertir a array y ordenar por frecuencia
  const keywords = Array.from(keywordMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([keyword, frequency]) => ({
      keyword,
      frequency,
      inCurrentTitle: currentTitle.toLowerCase().includes(keyword),
      relevanceScore: frequency / competitors.length // Score 0-1
    }))

  return keywords
}
