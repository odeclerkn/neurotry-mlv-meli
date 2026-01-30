import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveMeliConnection } from '@/lib/meli/tokens'
import { getValidAccessToken } from '@/lib/meli/client'

const MELI_API_URL = 'https://api.mercadolibre.com'
const CACHE_TTL_DAYS = 2 // Cache válido por 2 días (48 horas)

interface Keyword {
  keyword: string
  url: string
  searches: number
}

interface BasicAnalysisResult {
  status: 'used' | 'not_used'
  matchedIn: string[] // ['title', 'description']
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('category_id')
    const productId = searchParams.get('product_id')

    if (!categoryId) {
      return NextResponse.json(
        { error: 'category_id is required' },
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

    // 1. Intentar obtener keywords del cache
    let keywords: Keyword[] = []
    let source = 'none'
    let usedCache = false

    const { data: cachedData, error: cacheError } = await supabase
      .from('category_keywords_cache')
      .select('*')
      .eq('category_id', categoryId)
      .single()

    if (cachedData && !cacheError) {
      const cacheAge = Date.now() - new Date(cachedData.updated_at).getTime()
      const cacheAgeDays = cacheAge / (1000 * 60 * 60 * 24)

      // Si el cache tiene menos de 2 días, usarlo
      if (cacheAgeDays < CACHE_TTL_DAYS) {
        keywords = cachedData.keywords as Keyword[]
        source = cachedData.source
        usedCache = true
        console.log(`✅ Cache HIT para categoría ${categoryId} (${cacheAgeDays.toFixed(1)} días)`)
      } else {
        console.log(`⚠️ Cache EXPIRED para categoría ${categoryId} (${cacheAgeDays.toFixed(1)} días)`)
      }
    } else {
      console.log(`❌ Cache MISS para categoría ${categoryId}`)
    }

    // 2. Si no hay cache válido, consultar API de MercadoLibre
    if (keywords.length === 0) {
      const activeConnection = await getActiveMeliConnection(user.id)
      if (!activeConnection) {
        return NextResponse.json(
          { error: 'No active MELI connection' },
          { status: 404 }
        )
      }

      const accessToken = await getValidAccessToken(activeConnection.id)

      console.log(`Consultando API de MercadoLibre para categoría: ${categoryId}`)

      // Intento 1: Usar endpoint de trends
      try {
        const trendsUrl = `${MELI_API_URL}/trends/MLA/${categoryId}`
        const trendsResponse = await fetch(trendsUrl, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        })

        if (trendsResponse.ok) {
          const trendsData = await trendsResponse.json()

          if (Array.isArray(trendsData)) {
            keywords = trendsData
              .filter((item: any) => item.keyword)
              .slice(0, 20)
              .map((item: any, index: number) => ({
                keyword: item.keyword,
                url: item.url,
                searches: 1000 - (index * 50)
              }))
            source = 'trends'
          }
        }
      } catch (error) {
        console.error('Error en endpoint trends:', error)
      }

      // Intento 2: Si no hay keywords, buscar en productos más vendidos
      if (keywords.length === 0) {
        console.log('Extrayendo keywords de productos más vendidos...')

        try {
          const searchUrl = `${MELI_API_URL}/sites/MLA/search?category=${categoryId}&limit=50&sort=sold_quantity_desc`
          const searchResponse = await fetch(searchUrl, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            }
          })

          if (searchResponse.ok) {
            const searchData = await searchResponse.json()

            const titleWords = new Map<string, number>()

            searchData.results?.slice(0, 20).forEach((item: any) => {
              const words = item.title
                .toLowerCase()
                .split(/\s+/)
                .filter((w: string) => w.length > 3)
                .filter((w: string) => !/^\d+$/.test(w))

              words.forEach((word: string) => {
                titleWords.set(word, (titleWords.get(word) || 0) + 1)
              })
            })

            keywords = Array.from(titleWords.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 20)
              .map(([word, count]) => ({
                keyword: word,
                url: `https://listado.mercadolibre.com.ar/${word.replace(/\s+/g, '-')}`,
                searches: count * 100
              }))
            source = 'products'
          }
        } catch (error) {
          console.error('Error en endpoint search:', error)
        }
      }

      // 3. Guardar en cache si obtuvimos keywords
      if (keywords.length > 0) {
        const { error: upsertError } = await supabase
          .from('category_keywords_cache')
          .upsert({
            category_id: categoryId,
            keywords: keywords,
            source: source,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'category_id'
          })

        if (upsertError) {
          console.error('Error guardando cache:', upsertError)
        } else {
          console.log(`💾 Cache guardado para categoría ${categoryId}`)
        }
      }
    }

    // 4. Si se proporcionó product_id, hacer análisis básico
    let basicAnalysis: BasicAnalysisResult[] | undefined = undefined

    if (productId && keywords.length > 0) {
      // Obtener el producto
      const { data: product } = await supabase
        .from('meli_products')
        .select('title, description')
        .eq('meli_product_id', productId)
        .single()

      if (product) {
        const title = (product.title || '').toLowerCase()
        const description = (product.description || '').toLowerCase()

        basicAnalysis = keywords.map((kw) => {
          const normalizedKeyword = kw.keyword.toLowerCase().trim()
          const matchedIn: string[] = []

          if (title.includes(normalizedKeyword)) {
            matchedIn.push('title')
          }
          if (description.includes(normalizedKeyword)) {
            matchedIn.push('description')
          }

          return {
            status: matchedIn.length > 0 ? 'used' : 'not_used',
            matchedIn
          }
        })

        console.log(`✓ Análisis básico realizado para ${keywords.length} keywords`)
      }
    }

    console.log(`Retornando ${keywords.length} keywords (cache: ${usedCache})`)

    return NextResponse.json({
      keywords,
      basicAnalysis,
      category_id: categoryId,
      source,
      cached: usedCache,
      cache_age_days: usedCache && cachedData ?
        ((Date.now() - new Date(cachedData.updated_at).getTime()) / (1000 * 60 * 60 * 24)).toFixed(1) :
        null
    })
  } catch (error) {
    console.error('Error in /api/meli/trending-keywords:', error)
    return NextResponse.json(
      { keywords: [], error: 'Internal server error' },
      { status: 500 }
    )
  }
}
