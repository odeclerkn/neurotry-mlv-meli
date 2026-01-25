import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveMeliConnection } from '@/lib/meli/tokens'
import ExcelJS from 'exceljs'

export async function GET(request: NextRequest) {
  try {
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

    // Obtener todos los productos con análisis
    const { data: products, error } = await supabase
      .from('meli_products')
      .select(`
        *,
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
      .eq('connection_id', activeConnection.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json(
        { error: 'Error fetching products' },
        { status: 500 }
      )
    }

    console.log(`Export - Total productos obtenidos: ${products.length}`)
    if (products.length > 0) {
      console.log('Export - Primer producto estructura:', JSON.stringify(products[0], null, 2))
    }

    // Filtrar solo productos con análisis (puede ser array u objeto)
    const productsWithAnalysis = products.filter((p: any) => {
      if (Array.isArray(p.product_ai_analysis)) {
        return p.product_ai_analysis.length > 0
      }
      return p.product_ai_analysis && typeof p.product_ai_analysis === 'object'
    })

    console.log(`Export - Total productos: ${products.length}, Con análisis: ${productsWithAnalysis.length}`)

    if (productsWithAnalysis.length === 0) {
      return NextResponse.json(
        {
          error: 'No hay productos analizados para exportar. Primero analiza algunas publicaciones usando el botón "🤖 Analizar con IA" en el detalle de cada producto.'
        },
        { status: 404 }
      )
    }

    // Crear Excel
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Neurotry MLV MELI'
    workbook.created = new Date()

    // ==================================================
    // HOJA 1: Análisis de Publicaciones
    // ==================================================
    const mainSheet = workbook.addWorksheet('Análisis de Publicaciones')

    // Configurar columnas
    mainSheet.columns = [
      { header: 'ID Producto', key: 'id', width: 15 },
      { header: 'Título Original', key: 'original_title', width: 50 },
      { header: 'Título Sugerido por IA', key: 'suggested_title', width: 50 },
      { header: '¿Por qué cambiar el título?', key: 'title_explanation', width: 60 },
      { header: 'Descripción Original', key: 'original_description', width: 50 },
      { header: 'Descripción Sugerida', key: 'suggested_description', width: 50 },
      { header: 'Explicación de Mejoras en Descripción', key: 'improvements_explanation', width: 60 },
      { header: 'Score Actual (0-10 = Qué tan optimizada está)', key: 'score', width: 20 },
      { header: 'Keywords Relevantes Usados', key: 'keywords_used', width: 40 },
      { header: 'Keywords Relevantes NO Usados (Oportunidades)', key: 'keywords_not_used', width: 40 },
      { header: 'Precio', key: 'price', width: 15 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Vendidos', key: 'sold', width: 10 },
      { header: 'Proveedor IA', key: 'ai_provider', width: 15 },
      { header: 'Fecha de Análisis', key: 'analyzed_at', width: 20 }
    ]

    // Estilo del encabezado
    mainSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    mainSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    }
    mainSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    mainSheet.getRow(1).height = 40

    // Agregar datos
    productsWithAnalysis.forEach((product: any) => {
      const analysis = Array.isArray(product.product_ai_analysis)
        ? product.product_ai_analysis[0]
        : product.product_ai_analysis

      const keywordAnalysis = analysis.keyword_analysis || []
      const keywordsUsed = keywordAnalysis
        .filter((kw: any) => kw.isRelevant && kw.inCurrentListing)
        .map((kw: any) => kw.keyword)
        .join(', ')

      const keywordsNotUsed = keywordAnalysis
        .filter((kw: any) => kw.isRelevant && !kw.inCurrentListing)
        .map((kw: any) => kw.keyword)
        .join(', ')

      mainSheet.addRow({
        id: product.meli_product_id,
        original_title: product.title,
        suggested_title: analysis.suggested_title || product.title,
        title_explanation: analysis.summary || 'Ver sección de mejoras',
        original_description: product.description || 'Sin descripción',
        suggested_description: analysis.suggested_description || 'Sin sugerencias',
        improvements_explanation: analysis.improvements_explanation || analysis.summary || '',
        score: analysis.overall_score || 0,
        keywords_used: keywordsUsed || 'Ninguno',
        keywords_not_used: keywordsNotUsed || 'Ninguno',
        price: product.price,
        stock: product.available_quantity,
        sold: product.sold_quantity || 0,
        ai_provider:
          analysis.ai_provider === 'anthropic'
            ? 'Claude'
            : analysis.ai_provider === 'openai'
            ? 'GPT-4'
            : analysis.ai_provider === 'gemini'
            ? 'Gemini'
            : 'Básico',
        analyzed_at: analysis.analyzed_at
          ? new Date(analysis.analyzed_at).toLocaleString('es-AR')
          : ''
      })
    })

    // Aplicar color según score
    mainSheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const scoreCell = row.getCell('score')
        const score = Number(scoreCell.value)

        if (score >= 7) {
          scoreCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF92D050' } // Verde
          }
        } else if (score >= 4) {
          scoreCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFC000' } // Amarillo
          }
        } else {
          scoreCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFF6B6B' } // Rojo
          }
        }
        scoreCell.font = { bold: true }
      }
    })

    // ==================================================
    // HOJA 2: Guía de Lectura
    // ==================================================
    const guideSheet = workbook.addWorksheet('Guía de Lectura')
    guideSheet.columns = [
      { header: 'Sección', key: 'section', width: 30 },
      { header: 'Explicación', key: 'explanation', width: 100 }
    ]

    guideSheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
    guideSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    }

    const guideData = [
      {
        section: '📊 Score de Optimización (0-10)',
        explanation: `Este número indica qué tan optimizada está tu publicación actualmente:
• 0-3: ❌ Necesita optimización URGENTE - La publicación tiene problemas significativos
• 4-6: ⚠️ Puede mejorar significativamente - Hay oportunidades claras de optimización
• 7-8: ✅ Está bien optimizada - La publicación es competitiva
• 9-10: ⭐ Excelente, casi perfecta - La publicación está muy bien optimizada

El score considera: uso de keywords relevantes, estructura del título, completitud de la descripción, comparación con competidores exitosos.`
      },
      {
        section: '🎯 Keywords Relevantes',
        explanation: `Son palabras clave que:
1. La gente busca activamente en MercadoLibre
2. Son apropiadas y relevantes para TU producto específico
3. Están siendo usadas por competidores exitosos

NO son keywords genéricos de la categoría, sino términos validados como relevantes para tu producto por análisis de IA.`
      },
      {
        section: '🔴 Keywords NO Usados',
        explanation: `Son keywords relevantes para tu producto que NO estás usando en tu título o descripción.

IMPORTANTE: Estos son oportunidades de mejora concretas. Incorporar estos keywords puede:
• Mejorar tu posicionamiento en búsquedas
• Aumentar la visibilidad de tu publicación
• Atraer más compradores potenciales

La columna "¿Por qué cambiar el título?" te explica cómo incorporarlos naturalmente.`
      },
      {
        section: '💡 Título Sugerido',
        explanation: `Es una versión optimizada de tu título generada por IA que:
• Incorpora keywords relevantes que te faltan
• Sigue el formato estándar de MercadoLibre (MARCA MODELO ATRIBUTOS)
• Evita "keyword stuffing" (saturación de palabras clave)
• Se mantiene dentro de los límites de caracteres
• Incluye solo información verdadera de tu producto

Compáralo con tu título original y evalúa los cambios propuestos.`
      },
      {
        section: '✅ Descripción Sugerida',
        explanation: `Son mejoras específicas para tu descripción que:
• Incorporan keywords relevantes de forma natural
• Hacen la descripción más completa y útil
• Mantienen un tono profesional
• Destacan características importantes que pueden estar faltando

Cada sugerencia está pensada para mejorar la conversión sin hacer promesas falsas.`
      },
      {
        section: '🤖 Proveedor IA',
        explanation: `Indica qué inteligencia artificial analizó esta publicación:
• Claude (Anthropic): Excelente en análisis de texto y contexto
• GPT-4 (OpenAI): Muy preciso y confiable
• Gemini (Google): Buena calidad, opción gratuita hasta cierto límite
• Básico: Análisis sin IA (solo validación por atributos)

El proveedor usado depende de qué API key configuraste en el sistema.`
      },
      {
        section: '📈 Cómo usar este reporte',
        explanation: `1. Ordena por "Score" para identificar las publicaciones que necesitan más atención
2. Revisa las publicaciones con score bajo (0-3) primero - son las de mayor impacto
3. Lee la columna "¿Por qué cambiar el título?" para entender las mejoras sugeridas
4. Compara tu título/descripción con las sugerencias
5. Incorpora los "Keywords NO Usados" que tengan sentido para tu producto
6. NO copies textualmente - usa las sugerencias como guía y adapta a tu estilo
7. Actualiza tus publicaciones en MercadoLibre manualmente
8. Re-analiza después de un tiempo para ver la mejora en el score`
      }
    ]

    guideData.forEach((item) => {
      const row = guideSheet.addRow(item)
      row.alignment = { vertical: 'top', wrapText: true }
      row.height = 120
      row.getCell('section').font = { bold: true, size: 12 }
    })

    // ==================================================
    // HOJA 3: Datos Detallados (Keywords)
    // ==================================================
    const detailSheet = workbook.addWorksheet('Datos Detallados - Keywords')
    detailSheet.columns = [
      { header: 'ID Producto', key: 'product_id', width: 15 },
      { header: 'Título Producto', key: 'product_title', width: 40 },
      { header: 'Keyword', key: 'keyword', width: 20 },
      { header: '¿Es Relevante?', key: 'is_relevant', width: 15 },
      { header: 'Score (0-10)', key: 'score', width: 12 },
      { header: 'Razón', key: 'reason', width: 50 },
      { header: '¿Está en la publicación?', key: 'in_listing', width: 20 }
    ]

    detailSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    detailSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFED7D31' }
    }
    detailSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }

    productsWithAnalysis.forEach((product: any) => {
      const analysis = Array.isArray(product.product_ai_analysis)
        ? product.product_ai_analysis[0]
        : product.product_ai_analysis

      const keywordAnalysis = analysis.keyword_analysis || []

      keywordAnalysis.forEach((kw: any) => {
        detailSheet.addRow({
          product_id: product.meli_product_id,
          product_title: product.title,
          keyword: kw.keyword,
          is_relevant: kw.isRelevant ? 'SÍ' : 'NO',
          score: kw.score || 0,
          reason: kw.reason || '',
          in_listing: kw.inCurrentListing ? 'SÍ' : 'NO'
        })
      })
    })

    // Aplicar colores
    detailSheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const relevantCell = row.getCell('is_relevant')
        const inListingCell = row.getCell('in_listing')

        if (relevantCell.value === 'SÍ' && inListingCell.value === 'SÍ') {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD4EDDA' } // Verde claro
          }
        } else if (relevantCell.value === 'SÍ' && inListingCell.value === 'NO') {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFF3CD' } // Amarillo claro
          }
        }
      }
    })

    // Generar buffer del archivo Excel
    const buffer = await workbook.xlsx.writeBuffer()

    // Retornar el archivo
    const filename = `analisis_publicaciones_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error generating Excel:', error)
    return NextResponse.json(
      {
        error: 'Error generating Excel file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
