import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveMeliConnection } from '@/lib/meli/tokens'
import { getValidAccessToken } from '@/lib/meli/client'

const MELI_API_URL = 'https://api.mercadolibre.com'

interface CompetitorDetails {
  id: string
  title: string
  price: number
  sold_quantity: number
  available_quantity: number
  thumbnail: string
  permalink: string
  condition: string
  listing_type_id: string
  // Datos detallados
  shipping: {
    free_shipping: boolean
    mode: string | null // 'me2' (Full), 'me1' (Flex), null
    store_pick_up: boolean
  }
  installments: {
    quantity: number
    amount: number
    rate: number
    currency_id: string
  } | null
  accepts_mercadopago: boolean
  warranty: string | null
  seller_reputation: {
    level_id: string | null
    power_seller_status: string | null
  }
  attributes: any[]
}

interface FrequentQuestion {
  question: string
  answer: string | null
  date_created: string
}

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
    console.log(`🔍 Analizando competidores para: ${productId}`)

    // 1. Obtener información completa del producto
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
    console.log(`📦 Producto: ${productData.title}`)

    // 2. Construir query de búsqueda
    const attributes = productData.attributes || []
    const brand = attributes.find((attr: any) => attr.id === 'BRAND')?.value_name
    const model = attributes.find((attr: any) => attr.id === 'MODEL')?.value_name
    const categoryId = productData.category_id

    let searchQuery = ''
    if (brand && model) {
      searchQuery = `${brand} ${model}`
    } else if (brand) {
      searchQuery = brand
    } else {
      const titleWords = productData.title
        .split(' ')
        .filter((word: string) => word.length > 3)
        .slice(0, 3)
        .join(' ')
      searchQuery = titleWords
    }

    console.log(`🔎 Buscando: ${searchQuery}`)

    // 3. Buscar productos similares exitosos
    const searchUrl = `${MELI_API_URL}/sites/MLA/search?` + new URLSearchParams({
      q: searchQuery,
      category: categoryId,
      limit: '30',
      sort: 'sold_quantity_desc',
      ...(brand && { 'BRAND': brand })
    }).toString()

    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!searchResponse.ok) {
      console.error(`Error en búsqueda: ${searchResponse.status}`)
      return NextResponse.json({ competitors: [], analysis: null })
    }

    const searchData = await searchResponse.json()
    const competitorIds = searchData.results
      ?.filter((item: any) => item.id !== productId)
      ?.slice(0, 10)
      ?.map((item: any) => item.id) || []

    console.log(`✅ Encontrados ${competitorIds.length} competidores`)

    // 4. Obtener detalles completos de cada competidor (en paralelo)
    console.log(`📥 Obteniendo detalles completos...`)
    const competitorDetailsPromises = competitorIds.map(async (id: string) => {
      try {
        const response = await fetch(`${MELI_API_URL}/items/${id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        })

        if (!response.ok) {
          console.warn(`⚠️ Error obteniendo detalles de ${id}`)
          return null
        }

        const data = await response.json()

        return {
          id: data.id,
          title: data.title,
          price: data.price,
          sold_quantity: data.sold_quantity || 0,
          available_quantity: data.available_quantity,
          thumbnail: data.thumbnail,
          permalink: data.permalink,
          condition: data.condition,
          listing_type_id: data.listing_type_id,
          shipping: {
            free_shipping: data.shipping?.free_shipping || false,
            mode: data.shipping?.mode || null,
            store_pick_up: data.shipping?.store_pick_up || false
          },
          installments: data.installments || null,
          accepts_mercadopago: data.accepts_mercadopago || false,
          warranty: data.warranty || null,
          seller_reputation: {
            level_id: data.seller?.seller_reputation?.level_id || null,
            power_seller_status: data.seller?.seller_reputation?.power_seller_status || null
          },
          attributes: data.attributes || []
        } as CompetitorDetails
      } catch (error) {
        console.error(`Error procesando competidor ${id}:`, error)
        return null
      }
    })

    const competitorsDetails = (await Promise.all(competitorDetailsPromises))
      .filter((c): c is CompetitorDetails => c !== null)

    console.log(`✓ Detalles obtenidos: ${competitorsDetails.length}`)

    // 5. Obtener preguntas frecuentes de los top 5 competidores
    console.log(`❓ Obteniendo preguntas frecuentes...`)
    const topCompetitors = competitorsDetails.slice(0, 5)

    const questionsPromises = topCompetitors.map(async (competitor) => {
      try {
        const response = await fetch(
          `${MELI_API_URL}/questions/search?item=${competitor.id}&status=ANSWERED&limit=20`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          }
        )

        if (!response.ok) return []

        const data = await response.json()
        return data.questions?.map((q: any) => ({
          question: q.text,
          answer: q.answer?.text || null,
          date_created: q.date_created,
          item_id: competitor.id
        })) || []
      } catch (error) {
        console.error(`Error obteniendo preguntas de ${competitor.id}:`, error)
        return []
      }
    })

    const allQuestions = (await Promise.all(questionsPromises)).flat()
    console.log(`✓ Preguntas obtenidas: ${allQuestions.length}`)

    // 6. Analizar patrones de preguntas frecuentes
    const questionPatterns = analyzeQuestionPatterns(allQuestions)

    // 7. Análisis comercial detallado
    const commercialAnalysis = analyzeCommercialPatterns(competitorsDetails)

    // 8. Análisis de formas de pago optimizado
    const paymentAnalysis = analyzePaymentPatterns(competitorsDetails, productData)

    // 9. Análisis de envío optimizado
    const shippingAnalysis = analyzeShippingPatterns(competitorsDetails, productData)

    console.log(`========================================`)

    return NextResponse.json({
      product: {
        id: productData.id,
        title: productData.title,
        price: productData.price,
        sold_quantity: productData.sold_quantity || 0
      },
      competitors: competitorsDetails,
      analysis: {
        commercial: commercialAnalysis,
        payment: paymentAnalysis,
        shipping: shippingAnalysis,
        frequentQuestions: questionPatterns,
        totalCompetitors: competitorsDetails.length
      }
    })
  } catch (error) {
    console.error('Error in /api/meli/similar-products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Analizar patrones en preguntas frecuentes
function analyzeQuestionPatterns(questions: any[]): any {
  if (questions.length === 0) {
    return {
      totalQuestions: 0,
      commonTopics: [],
      recommendations: []
    }
  }

  // Extraer tópicos comunes
  const topicKeywords = {
    medidas: ['medida', 'medidas', 'tamaño', 'dimensiones', 'largo', 'ancho', 'alto', 'peso'],
    material: ['material', 'tela', 'plástico', 'metal', 'calidad'],
    compatibilidad: ['compatible', 'compatibilidad', 'sirve', 'funciona', 'modelo'],
    stock: ['stock', 'disponible', 'hay', 'cuando'],
    envío: ['envío', 'envio', 'demora', 'llega', 'entrega'],
    garantía: ['garantía', 'garantia', 'cambio', 'devolución'],
    original: ['original', 'genuino', 'nuevo', 'usado'],
    color: ['color', 'colores'],
    precio: ['precio', 'costo', 'descuento', 'oferta']
  }

  const topicCounts: Record<string, number> = {}
  const topicQuestions: Record<string, string[]> = {}

  questions.forEach(q => {
    const questionLower = q.question.toLowerCase()

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => questionLower.includes(keyword))) {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1
        if (!topicQuestions[topic]) topicQuestions[topic] = []
        if (topicQuestions[topic].length < 3) {
          topicQuestions[topic].push(q.question)
        }
      }
    })
  })

  // Ordenar tópicos por frecuencia
  const sortedTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([topic, count]) => ({
      topic,
      count,
      percentage: Math.round((count / questions.length) * 100),
      examples: topicQuestions[topic] || []
    }))

  // Generar recomendaciones
  const recommendations: string[] = []

  sortedTopics.slice(0, 3).forEach(({ topic, percentage }) => {
    if (percentage > 20) {
      switch (topic) {
        case 'medidas':
          recommendations.push('Agregar medidas específicas en el título o descripción')
          break
        case 'material':
          recommendations.push('Especificar claramente el material del producto')
          break
        case 'compatibilidad':
          recommendations.push('Listar modelos compatibles en la descripción')
          break
        case 'original':
          recommendations.push('Aclarar si es producto original/nuevo en el título')
          break
        case 'color':
          recommendations.push('Especificar colores disponibles claramente')
          break
      }
    }
  })

  return {
    totalQuestions: questions.length,
    commonTopics: sortedTopics,
    recommendations
  }
}

// Analizar patrones comerciales generales
function analyzeCommercialPatterns(competitors: CompetitorDetails[]): any {
  if (competitors.length === 0) return null

  // Análisis de envío
  const freeShippingCount = competitors.filter(c => c.shipping.free_shipping).length
  const fullFulfillmentCount = competitors.filter(c => c.shipping.mode === 'me2').length
  const flexFulfillmentCount = competitors.filter(c => c.shipping.mode === 'me1').length
  const storePickupCount = competitors.filter(c => c.shipping.store_pick_up).length

  // Análisis de financiación
  const withInstallments = competitors.filter(c => c.installments !== null)
  const interestFreeCount = withInstallments.filter(c => c.installments!.rate === 0).length
  const avgMaxInstallments = withInstallments.length > 0
    ? Math.round(withInstallments.reduce((sum, c) => sum + (c.installments?.quantity || 0), 0) / withInstallments.length)
    : 0

  // Análisis de tipo de publicación
  const listingTypes: Record<string, number> = {}
  competitors.forEach(c => {
    listingTypes[c.listing_type_id] = (listingTypes[c.listing_type_id] || 0) + 1
  })
  const mostCommonListing = Object.entries(listingTypes).sort((a, b) => b[1] - a[1])[0]

  // Análisis de garantía
  const withWarranty = competitors.filter(c => c.warranty !== null).length

  // Análisis de reputación
  const platinumSellers = competitors.filter(
    c => c.seller_reputation.power_seller_status === 'platinum'
  ).length

  return {
    shipping: {
      freeShipping: {
        count: freeShippingCount,
        percentage: Math.round((freeShippingCount / competitors.length) * 100)
      },
      fullFulfillment: {
        count: fullFulfillmentCount,
        percentage: Math.round((fullFulfillmentCount / competitors.length) * 100)
      },
      flexFulfillment: {
        count: flexFulfillmentCount,
        percentage: Math.round((flexFulfillmentCount / competitors.length) * 100)
      },
      storePickup: {
        count: storePickupCount,
        percentage: Math.round((storePickupCount / competitors.length) * 100)
      }
    },
    financing: {
      withInstallments: {
        count: withInstallments.length,
        percentage: Math.round((withInstallments.length / competitors.length) * 100)
      },
      averageMaxInstallments: avgMaxInstallments,
      interestFree: {
        count: interestFreeCount,
        percentage: withInstallments.length > 0
          ? Math.round((interestFreeCount / withInstallments.length) * 100)
          : 0
      }
    },
    listingType: {
      mostCommon: mostCommonListing?.[0] || 'N/A',
      mostCommonCount: mostCommonListing?.[1] || 0,
      mostCommonPercentage: mostCommonListing
        ? Math.round((mostCommonListing[1] / competitors.length) * 100)
        : 0
    },
    warranty: {
      count: withWarranty,
      percentage: Math.round((withWarranty / competitors.length) * 100)
    },
    reputation: {
      platinum: {
        count: platinumSellers,
        percentage: Math.round((platinumSellers / competitors.length) * 100)
      }
    }
  }
}

// Análisis específico de formas de pago con recomendaciones
function analyzePaymentPatterns(competitors: CompetitorDetails[], currentProduct: any): any {
  const withInstallments = competitors.filter(c => c.installments !== null)

  if (withInstallments.length === 0) {
    return {
      recommendation: 'No hay datos suficientes de formas de pago',
      priority: 'low'
    }
  }

  // Calcular estadísticas
  const installmentQuantities = withInstallments.map(c => c.installments!.quantity)
  const interestFreeCount = withInstallments.filter(c => c.installments!.rate === 0).length
  const mostCommonQuantity = mode(installmentQuantities)
  const avgQuantity = Math.round(
    installmentQuantities.reduce((sum, q) => sum + q, 0) / installmentQuantities.length
  )

  // Obtener cuotas del producto actual
  const currentInstallments = currentProduct.installments?.quantity || 0
  const currentInterestFree = currentProduct.installments?.rate === 0

  // Generar recomendación
  let recommendation = ''
  let priority: 'high' | 'medium' | 'low' = 'low'
  let reason = ''

  const interestFreePercentage = Math.round((interestFreeCount / withInstallments.length) * 100)

  if (currentInstallments === 0) {
    recommendation = `Habilitar financiación. El ${Math.round((withInstallments.length / competitors.length) * 100)}% de competidores ofrece cuotas`
    priority = 'high'
    reason = 'Tu producto no ofrece cuotas mientras que la mayoría de competidores sí'
  } else if (currentInstallments < mostCommonQuantity) {
    recommendation = `Aumentar de ${currentInstallments} a ${mostCommonQuantity} cuotas sin interés`
    priority = 'high'
    reason = `${mostCommonQuantity} cuotas es lo más común entre competidores exitosos`
  } else if (!currentInterestFree && interestFreePercentage > 50) {
    recommendation = `Ofrecer cuotas sin interés. El ${interestFreePercentage}% de competidores las ofrece`
    priority = 'medium'
    reason = 'Las cuotas sin interés aumentan significativamente la conversión'
  } else {
    recommendation = `Tu financiación está bien configurada (${currentInstallments} cuotas)`
    priority = 'low'
    reason = 'Estás alineado con los competidores exitosos'
  }

  return {
    currentStatus: {
      installments: currentInstallments,
      interestFree: currentInterestFree
    },
    marketAverage: {
      installments: avgQuantity,
      mostCommon: mostCommonQuantity,
      interestFreePercentage
    },
    recommendation,
    reason,
    priority
  }
}

// Análisis específico de envío con recomendaciones
function analyzeShippingPatterns(competitors: CompetitorDetails[], currentProduct: any): any {
  const freeShippingCount = competitors.filter(c => c.shipping.free_shipping).length
  const fullCount = competitors.filter(c => c.shipping.mode === 'me2').length
  const flexCount = competitors.filter(c => c.shipping.mode === 'me1').length

  const currentFreeShipping = currentProduct.shipping?.free_shipping || false
  const currentMode = currentProduct.shipping?.mode || null

  const freeShippingPercentage = Math.round((freeShippingCount / competitors.length) * 100)
  const fullPercentage = Math.round((fullCount / competitors.length) * 100)

  let recommendation = ''
  let priority: 'high' | 'medium' | 'low' = 'low'
  let reason = ''

  if (!currentFreeShipping && freeShippingPercentage > 70) {
    recommendation = 'Activar envío gratis'
    priority = 'high'
    reason = `${freeShippingPercentage}% de competidores exitosos ofrecen envío gratis`
  } else if (currentMode !== 'me2' && fullPercentage > 50) {
    recommendation = 'Considerar Mercado Envíos Full'
    priority = 'medium'
    reason = `${fullPercentage}% de competidores usan Full (entrega más rápida)`
  } else {
    recommendation = 'Tu configuración de envío está bien'
    priority = 'low'
    reason = 'Estás alineado con los competidores'
  }

  return {
    currentStatus: {
      freeShipping: currentFreeShipping,
      fulfillmentMode: currentMode
    },
    marketStats: {
      freeShippingPercentage,
      fullPercentage,
      flexPercentage: Math.round((flexCount / competitors.length) * 100)
    },
    recommendation,
    reason,
    priority
  }
}

// Función auxiliar: calcular moda (valor más frecuente)
function mode(arr: number[]): number {
  const frequency: Record<number, number> = {}
  arr.forEach(val => {
    frequency[val] = (frequency[val] || 0) + 1
  })
  return parseInt(
    Object.entries(frequency).sort((a, b) => b[1] - a[1])[0]?.[0] || '0'
  )
}
