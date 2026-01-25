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

    // Obtener información completa del producto
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

    // Construir el prompt
    const prompt = buildPrompt(productData, keywords)

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

    return NextResponse.json({
      success: true,
      analysis,
      product: {
        id: productData.id,
        title: productData.title,
        description: productData.description?.plain_text,
        attributes: productData.attributes
      },
      provider
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
function buildPrompt(productData: any, keywords: any[]): string {
  return `Analiza esta publicación de MercadoLibre y los keywords trending de la categoría.

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
   - Sugerencias para mejorar la descripción incorporando keywords relevantes naturalmente
   - Atributos que podrían estar faltando

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
    "descriptionImprovements": ["string"],
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

    return NextResponse.json({
      success: true,
      analysis: {
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
      },
      product: {
        id: productData.id,
        title: productData.title,
        description: productData.description?.plain_text,
        attributes: productData.attributes
      },
      provider: 'basic'
    })
  } catch (error) {
    console.error('Error in basicAnalysis:', error)
    return NextResponse.json(
      { error: 'Error en análisis básico' },
      { status: 500 }
    )
  }
}
