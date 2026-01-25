import { NextRequest, NextResponse } from 'next/server'

const MELI_API_URL = 'https://api.mercadolibre.com'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('category_id')

    if (!categoryId) {
      return NextResponse.json(
        { error: 'category_id is required' },
        { status: 400 }
      )
    }

    console.log(`Buscando keywords trending para categoría: ${categoryId}`)

    // Intento 1: Usar endpoint de trends
    let keywords: any[] = []

    try {
      const trendsResponse = await fetch(
        `${MELI_API_URL}/trends/MLA/${categoryId}`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      )

      if (trendsResponse.ok) {
        const trendsData = await trendsResponse.json()
        console.log('Respuesta de trends:', trendsData)

        // El endpoint de trends devuelve un array de objetos con keyword y url
        if (Array.isArray(trendsData)) {
          keywords = trendsData
            .filter((item: any) => item.keyword)
            .slice(0, 20)
            .map((item: any, index: number) => ({
              keyword: item.keyword,
              url: item.url,
              searches: 1000 - (index * 50) // Simulamos búsquedas decrecientes
            }))
        }
      } else {
        console.log(`Trends endpoint error: ${trendsResponse.status}`)
      }
    } catch (error) {
      console.error('Error en endpoint trends:', error)
    }

    // Intento 2: Si no hay keywords, buscar en "hot items" de la categoría
    if (keywords.length === 0) {
      try {
        const searchResponse = await fetch(
          `${MELI_API_URL}/sites/MLA/search?category=${categoryId}&limit=50&sort=sold_quantity_desc`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        )

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          console.log(`Encontrados ${searchData.results?.length || 0} productos en la categoría`)

          // Extraer keywords de los títulos de productos más vendidos
          const titleWords = new Map<string, number>()

          searchData.results?.slice(0, 20).forEach((item: any) => {
            const words = item.title
              .toLowerCase()
              .split(/\s+/)
              .filter((w: string) => w.length > 3) // Solo palabras de más de 3 caracteres
              .filter((w: string) => !/^\d+$/.test(w)) // Excluir solo números

            words.forEach((word: string) => {
              titleWords.set(word, (titleWords.get(word) || 0) + 1)
            })
          })

          // Convertir a array y ordenar por frecuencia
          keywords = Array.from(titleWords.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([word, count]) => ({
              keyword: word,
              url: `https://listado.mercadolibre.com.ar/${word.replace(/\s+/g, '-')}`,
              searches: count * 100 // Multiplicar para simular volumen
            }))
        } else {
          console.log(`Search endpoint error: ${searchResponse.status}`)
        }
      } catch (error) {
        console.error('Error en endpoint search:', error)
      }
    }

    console.log(`Retornando ${keywords.length} keywords`)

    return NextResponse.json({
      keywords,
      category_id: categoryId,
      source: keywords.length > 0 ? (keywords[0].url.includes('trends') ? 'trends' : 'products') : 'none'
    })
  } catch (error) {
    console.error('Error in /api/meli/trending-keywords:', error)
    return NextResponse.json(
      { keywords: [] },
      { status: 200 }
    )
  }
}
