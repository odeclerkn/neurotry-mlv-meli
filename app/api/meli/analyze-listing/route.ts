import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveMeliConnection } from '@/lib/meli/tokens'
import { getValidAccessToken } from '@/lib/meli/client'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

const MELI_API_URL = 'https://api.mercadolibre.com'

// Función para determinar qué proveedor de IA usar
function getAIProvider(): 'anthropic' | 'openai' | 'gemini' | 'none' {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
  if (process.env.OPENAI_API_KEY) return 'openai'
  if (process.env.GEMINI_API_KEY) return 'gemini'
  return 'none'
}

// GET: Obtener análisis guardado de un producto
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

    // Buscar el producto y su análisis
    const { data, error } = await supabase
      .from('meli_products')
      .select(`
        id,
        meli_product_id,
        title,
        description,
        product_ai_analysis (
          suggested_title,
          suggested_description,
          improvements_explanation,
          overall_score,
          summary,
          keyword_analysis,
          suggestions,
          ai_provider,
          analyzed_at
        )
      `)
      .eq('meli_product_id', meliProductId)
      .single()

    if (error) {
      console.error('Error obteniendo análisis:', error)
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Si no tiene análisis, retornar null
    if (!data.product_ai_analysis || data.product_ai_analysis.length === 0) {
      return NextResponse.json({
        hasAnalysis: false,
        analysis: null
      })
    }

    const savedAnalysis = Array.isArray(data.product_ai_analysis)
      ? data.product_ai_analysis[0]
      : data.product_ai_analysis

    return NextResponse.json({
      hasAnalysis: true,
      analysis: {
        keywordAnalysis: savedAnalysis.keyword_analysis,
        suggestions: savedAnalysis.suggestions,
        overallScore: savedAnalysis.overall_score,
        summary: savedAnalysis.summary
      },
      provider: savedAnalysis.ai_provider,
      analyzedAt: savedAnalysis.analyzed_at
    })
  } catch (error) {
    console.error('Error in GET /api/meli/analyze-listing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { product_id, keywords } = body

    if (!product_id || !keywords) {
      return NextResponse.json(
        { error: 'product_id and keywords are required' },
        { status: 400 }
      )
    }

    const provider = getAIProvider()

    if (provider === 'none') {
      console.warn('No AI API key configured, usando análisis básico')
      return await basicAnalysis(product_id, keywords)
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

    // Obtener el producto de nuestra BD para tener el UUID
    const { data: dbProduct, error: dbError } = await supabase
      .from('meli_products')
      .select('id, meli_product_id, title, description')
      .eq('meli_product_id', product_id)
      .eq('connection_id', activeConnection.id)
      .single()

    if (dbError || !dbProduct) {
      console.error('Error obteniendo producto de BD:', dbError)
      return NextResponse.json(
        { error: 'Product not found in database' },
        { status: 404 }
      )
    }

    // Obtener información completa del producto desde MELI API
    const productResponse = await fetch(`${MELI_API_URL}/items/${product_id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!productResponse.ok) {
      return NextResponse.json(
        { error: 'Error fetching product details' },
        { status: productResponse.status }
      )
    }

    const productData = await productResponse.json()

    // Verificar si existe un análisis previo para evolucionar sobre él
    const { data: previousAnalysis } = await supabase
      .from('product_ai_analysis')
      .select('suggested_title, suggested_description')
      .eq('product_id', dbProduct.id)
      .single()

    // Si hay análisis previo, usar las sugerencias como base para evolucionar
    // Si no, usar el título/descripción original de MercadoLibre
    const baseTitle = previousAnalysis?.suggested_title || productData.title
    const baseDescription = previousAnalysis?.suggested_description || productData.description?.plain_text

    // Crear una copia de productData con los datos base (sugeridos o originales)
    const productDataForPrompt = {
      ...productData,
      title: baseTitle,
      description: {
        ...productData.description,
        plain_text: baseDescription
      }
    }

    // Construir el prompt con los datos base
    const prompt = buildPrompt(productDataForPrompt, keywords, !!previousAnalysis)

    // Llamar al proveedor de IA correspondiente
    let analysisText: string

    console.log(`Usando proveedor de IA: ${provider}`)

    switch (provider) {
      case 'anthropic':
        analysisText = await callAnthropic(prompt)
        break
      case 'openai':
        analysisText = await callOpenAI(prompt)
        break
      case 'gemini':
        analysisText = await callGemini(prompt)
        break
      default:
        throw new Error('No AI provider available')
    }

    // Extraer JSON de la respuesta
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('Respuesta de IA no contiene JSON válido:', analysisText)
      throw new Error('No se pudo parsear la respuesta de IA')
    }

    const analysis = JSON.parse(jsonMatch[0])

    // Normalizar el score: si está en escala 0-100, convertir a 0-10
    let normalizedScore = analysis.overallScore || 0
    if (normalizedScore > 10) {
      normalizedScore = Math.round(normalizedScore / 10)
    }
    // Asegurar que esté en el rango válido
    normalizedScore = Math.max(0, Math.min(10, normalizedScore))

    const analysisData = {
      product_id: dbProduct.id,
      suggested_title: analysis.suggestions?.optimizedTitle || null,
      suggested_description: analysis.suggestions?.optimizedDescription || analysis.suggestions?.descriptionImprovements?.join('\n\n') || null,
      improvements_explanation: analysis.suggestions?.descriptionImprovements?.join('\n') || analysis.summary || null,
      overall_score: normalizedScore,
      summary: analysis.summary || null,
      keyword_analysis: analysis.keywordAnalysis || [],
      suggestions: analysis.suggestions || {},
      ai_provider: provider,
      analyzed_at: new Date().toISOString()
    }

    // Guardar análisis actual en la base de datos (UPSERT)
    const { error: saveError } = await supabase
      .from('product_ai_analysis')
      .upsert(analysisData, {
        onConflict: 'product_id'
      })

    if (saveError) {
      console.error('Error guardando análisis en BD:', saveError)
      // No retornar error, solo loguear - el análisis se generó correctamente
    }

    // Guardar en histórico (siempre INSERT, nunca UPSERT)
    const { error: historyError } = await supabase
      .from('product_ai_analysis_history')
      .insert(analysisData)

    if (historyError) {
      console.error('Error guardando análisis en histórico:', historyError)
    }

    return NextResponse.json({
      success: true,
      analysis,
      product: {
        id: productData.id,
        title: productData.title,
        description: productData.description?.plain_text,
        attributes: productData.attributes
      },
      provider,
      saved: !saveError
    })
  } catch (error) {
    console.error('Error in /api/meli/analyze-listing:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Construir el prompt común para todos los proveedores
function buildPrompt(productData: any, keywords: any[], isReanalysis: boolean = false): string {
  const contextNote = isReanalysis
    ? `\n⚠️ IMPORTANTE: Este es un RE-ANÁLISIS. El título y descripción que ves ya fueron optimizados previamente por IA. Tu tarea es EVOLUCIONAR estas sugerencias previas, no partir de cero. Busca nuevas oportunidades de mejora basándote en lo ya optimizado.\n`
    : `\n📝 Este es el PRIMER ANÁLISIS de esta publicación. Analiza el título y descripción originales de MercadoLibre.\n`

  return `Analiza esta publicación de MercadoLibre y los keywords trending de la categoría.
${contextNote}
PRODUCTO:
Título: ${productData.title}
Descripción: ${productData.description?.plain_text || 'Sin descripción'}
Precio: $${productData.price}
Categoría: ${productData.category_id}
Atributos: ${JSON.stringify(productData.attributes?.map((a: any) => ({ id: a.id, name: a.name, value: a.value_name })) || [], null, 2)}

KEYWORDS TRENDING DE LA CATEGORÍA:
${keywords.map((k: any) => `- ${k.keyword}`).join('\n')}

TAREA:
1. Para cada keyword trending, determina:
   - ¿Es RELEVANTE para este producto específico? (Sí/No)
   - Score de relevancia (0-10)
   - Razón de por qué es o no relevante

2. Identifica keywords relevantes que NO están en el título o descripción actual

3. Genera sugerencias concretas de mejora:
   - Sugerencia de título optimizado (máximo 60 caracteres, sin keyword stuffing)
   ${isReanalysis ? '   - Si es re-análisis: EVOLUCIONA el título previo, no lo reescribas desde cero' : ''}
   - Descripción COMPLETA optimizada (no solo mejoras, sino la descripción completa reescrita incorporando keywords relevantes de forma natural, manteniendo la información original y agregando detalles útiles)
   ${isReanalysis ? '   - Si es re-análisis: MEJORA la descripción previa, agregando más detalles o keywords nuevos' : ''}
   - Atributos que podrían estar faltando

IMPORTANTE sobre la descripción:
- Genera una descripción COMPLETA y lista para usar, no solo sugerencias
${isReanalysis ? '- Si es re-análisis: Parte de la versión optimizada previa y MEJÓRALA aún más, no la reescribas completamente desde cero\n- Identifica qué keywords o detalles nuevos se pueden agregar' : ''}
- Incorpora keywords relevantes naturalmente
- Mantén toda la información importante del producto
- Agrega detalles que puedan ayudar a la conversión
- Usa un tono profesional y claro
- Estructura con párrafos cortos para facilitar la lectura
- Incluye garantía, envío o detalles importantes si corresponde

Responde ÚNICAMENTE en formato JSON con esta estructura exacta:
{
  "keywordAnalysis": [
    {
      "keyword": "string",
      "isRelevant": boolean,
      "score": number,
      "reason": "string",
      "inCurrentListing": boolean
    }
  ],
  "suggestions": {
    "optimizedTitle": "string",
    "optimizedDescription": "string (descripción completa optimizada)",
    "descriptionImprovements": ["string (resumen de cambios realizados)"],
    "missingAttributes": ["string"]
  },
  "overallScore": number,
  "summary": "string"
}`
}

// Llamar a Anthropic Claude
async function callAnthropic(prompt: string): Promise<string> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  })

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: prompt
    }]
  })

  return message.content[0].type === 'text' ? message.content[0].text : ''
}

// Llamar a OpenAI
async function callOpenAI(prompt: string): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o', // o 'gpt-4-turbo' o 'gpt-3.5-turbo'
    messages: [
      {
        role: 'system',
        content: 'Eres un experto en optimización de publicaciones de e-commerce en MercadoLibre. Respondes únicamente en formato JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 2000,
    response_format: { type: 'json_object' }
  })

  return completion.choices[0].message.content || ''
}

// Llamar a Google Gemini
async function callGemini(prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2000,
    }
  })

  const result = await model.generateContent([
    'Eres un experto en optimización de publicaciones de e-commerce en MercadoLibre. Respondes únicamente en formato JSON.',
    prompt
  ])

  const response = await result.response
  return response.text()
}

// Análisis básico sin IA (fallback cuando no hay API key)
async function basicAnalysis(product_id: string, keywords: any[]) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activeConnection = await getActiveMeliConnection(user.id)
    if (!activeConnection) {
      return NextResponse.json({ error: 'No active MELI connection' }, { status: 404 })
    }

    const accessToken = await getValidAccessToken(activeConnection.id)

    // Obtener el producto de nuestra BD
    const { data: dbProduct, error: dbError } = await supabase
      .from('meli_products')
      .select('id, meli_product_id, title, description')
      .eq('meli_product_id', product_id)
      .eq('connection_id', activeConnection.id)
      .single()

    if (dbError || !dbProduct) {
      console.error('Error obteniendo producto de BD:', dbError)
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const productResponse = await fetch(`${MELI_API_URL}/items/${product_id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!productResponse.ok) {
      return NextResponse.json({ error: 'Error fetching product' }, { status: 500 })
    }

    const productData = await productResponse.json()

    // Análisis básico basado en atributos
    const keywordAnalysis = keywords.map((kw: any) => {
      const keyword = kw.keyword.toLowerCase()
      const title = (productData.title || '').toLowerCase()
      const description = (productData.description?.plain_text || '').toLowerCase()
      const inCurrentListing = title.includes(keyword) || description.includes(keyword)

      // Validación básica de relevancia por atributos
      const attributes = productData.attributes || []
      let isRelevant = false
      let score = 5
      let reason = 'Keyword genérico de la categoría'

      // Verificar si el keyword coincide con algún atributo
      for (const attr of attributes) {
        const attrValue = (attr.value_name || '').toLowerCase()
        if (attrValue.includes(keyword) || keyword.includes(attrValue)) {
          isRelevant = true
          score = 9
          reason = `Coincide con atributo del producto: ${attr.name}`
          break
        }
      }

      // Si está en el título/descripción, probablemente es relevante
      if (inCurrentListing && !isRelevant) {
        isRelevant = true
        score = 7
        reason = 'Ya está en la publicación actual'
      }

      return {
        keyword: kw.keyword,
        isRelevant,
        score,
        reason,
        inCurrentListing
      }
    })

    const analysis = {
      keywordAnalysis,
      suggestions: {
        optimizedTitle: productData.title,
        descriptionImprovements: [
          'Configure una API key de IA (OPENAI_API_KEY, GEMINI_API_KEY o ANTHROPIC_API_KEY) para obtener sugerencias avanzadas'
        ],
        missingAttributes: []
      },
      overallScore: 5,
      summary: 'Análisis básico completado. Configure una API key de IA para análisis avanzado.'
    }

    const basicAnalysisData = {
      product_id: dbProduct.id,
      suggested_title: analysis.suggestions.optimizedTitle,
      suggested_description: analysis.suggestions.descriptionImprovements.join('\n\n'),
      improvements_explanation: analysis.summary,
      overall_score: analysis.overallScore,
      summary: analysis.summary,
      keyword_analysis: analysis.keywordAnalysis,
      suggestions: analysis.suggestions,
      ai_provider: 'basic',
      analyzed_at: new Date().toISOString()
    }

    // Guardar análisis básico actual en la BD
    const { error: saveError } = await supabase
      .from('product_ai_analysis')
      .upsert(basicAnalysisData, {
        onConflict: 'product_id'
      })

    if (saveError) {
      console.error('Error guardando análisis básico en BD:', saveError)
    }

    // Guardar en histórico
    const { error: historyError } = await supabase
      .from('product_ai_analysis_history')
      .insert(basicAnalysisData)

    if (historyError) {
      console.error('Error guardando análisis básico en histórico:', historyError)
    }

    return NextResponse.json({
      success: true,
      analysis,
      product: {
        id: productData.id,
        title: productData.title,
        description: productData.description?.plain_text,
        attributes: productData.attributes
      },
      provider: 'basic',
      saved: !saveError
    })
  } catch (error) {
    console.error('Error in basicAnalysis:', error)
    return NextResponse.json(
      { error: 'Error en análisis básico' },
      { status: 500 }
    )
  }
}

// DELETE: Eliminar análisis guardado de un producto
export async function DELETE(request: NextRequest) {
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

    // Obtener el análisis actual antes de eliminarlo para registrarlo en histórico
    const { data: currentAnalysis } = await supabase
      .from('product_ai_analysis')
      .select('*')
      .eq('product_id', product.id)
      .single()

    // Eliminar el análisis
    const { error: deleteError } = await supabase
      .from('product_ai_analysis')
      .delete()
      .eq('product_id', product.id)

    if (deleteError) {
      console.error('Error eliminando análisis:', deleteError)
      return NextResponse.json(
        { error: 'Error deleting analysis' },
        { status: 500 }
      )
    }

    // Registrar la eliminación en el histórico
    if (currentAnalysis) {
      const deletionHistoryData = {
        product_id: product.id,
        suggested_title: currentAnalysis.suggested_title,
        suggested_description: currentAnalysis.suggested_description,
        improvements_explanation: currentAnalysis.improvements_explanation,
        overall_score: currentAnalysis.overall_score,
        summary: '[ELIMINADO] Análisis eliminado manualmente. Se empezó de cero.',
        keyword_analysis: currentAnalysis.keyword_analysis,
        suggestions: currentAnalysis.suggestions,
        ai_provider: currentAnalysis.ai_provider,
        analyzed_at: new Date().toISOString()
      }

      const { error: historyError } = await supabase
        .from('product_ai_analysis_history')
        .insert(deletionHistoryData)

      if (historyError) {
        console.error('Error guardando eliminación en histórico:', historyError)
        // No retornar error, el análisis fue eliminado correctamente
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Análisis eliminado correctamente'
    })
  } catch (error) {
    console.error('Error in DELETE /api/meli/analyze-listing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Restaurar un análisis del histórico como actual
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { history_id, product_id } = body

    if (!history_id || !product_id) {
      return NextResponse.json(
        { error: 'history_id and product_id are required' },
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

    // Buscar el análisis en el histórico
    const { data: historicalAnalysis, error: fetchError } = await supabase
      .from('product_ai_analysis_history')
      .select('*')
      .eq('id', history_id)
      .single()

    if (fetchError || !historicalAnalysis) {
      console.error('Error buscando análisis histórico:', fetchError)
      return NextResponse.json(
        { error: 'Historical analysis not found' },
        { status: 404 }
      )
    }

    // Verificar que el análisis pertenezca al producto correcto y al usuario
    const { data: product, error: productError } = await supabase
      .from('meli_products')
      .select('id, connection_id, meli_connections(user_id)')
      .eq('meli_product_id', product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // @ts-ignore - Verificar propiedad
    if (product.meli_connections?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Restaurar el análisis como actual (UPSERT)
    const restoreData = {
      product_id: historicalAnalysis.product_id,
      suggested_title: historicalAnalysis.suggested_title,
      suggested_description: historicalAnalysis.suggested_description,
      improvements_explanation: historicalAnalysis.improvements_explanation,
      overall_score: historicalAnalysis.overall_score,
      summary: historicalAnalysis.summary,
      keyword_analysis: historicalAnalysis.keyword_analysis,
      suggestions: historicalAnalysis.suggestions,
      ai_provider: historicalAnalysis.ai_provider,
      analyzed_at: new Date().toISOString()
    }

    const { error: restoreError } = await supabase
      .from('product_ai_analysis')
      .upsert(restoreData, {
        onConflict: 'product_id'
      })

    if (restoreError) {
      console.error('Error restaurando análisis:', restoreError)
      return NextResponse.json(
        { error: 'Error restoring analysis' },
        { status: 500 }
      )
    }

    // Crear registro en el histórico indicando la restauración
    const historyData = {
      ...restoreData,
      summary: `[RESTAURADO] Análisis del ${new Date(historicalAnalysis.analyzed_at).toLocaleDateString('es-AR')} restaurado como actual`
    }

    const { error: historyError } = await supabase
      .from('product_ai_analysis_history')
      .insert(historyData)

    if (historyError) {
      console.error('Error guardando en histórico:', historyError)
      // No retornar error, el análisis fue restaurado correctamente
    }

    return NextResponse.json({
      success: true,
      message: 'Análisis restaurado correctamente',
      analysis: restoreData
    })
  } catch (error) {
    console.error('Error in PUT /api/meli/analyze-listing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
