import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncMeliProducts } from '@/lib/meli/client'
import { saveMeliProducts, getActiveMeliConnection, getMeliConnectionById } from '@/lib/meli/tokens'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const connectionId = body?.connectionId

    // Si no se proporciona connectionId, usar la conexión activa
    let finalConnectionId = connectionId

    if (!finalConnectionId) {
      const activeConnection = await getActiveMeliConnection(user.id)
      if (!activeConnection) {
        return NextResponse.json(
          { error: 'No active MELI connection found' },
          { status: 404 }
        )
      }
      finalConnectionId = activeConnection.id
    }

    // Verificar que la conexión esté conectada (no desconectada)
    const connection = await getMeliConnectionById(finalConnectionId)

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      )
    }

    if (connection.status === 'disconnected') {
      return NextResponse.json(
        { error: 'Cannot sync products from a disconnected account. Please reconnect first.' },
        { status: 400 }
      )
    }

    // Sincronizar productos
    const products = await syncMeliProducts(finalConnectionId)

    // Guardar productos en la base de datos
    await saveMeliProducts(finalConnectionId, products)

    return NextResponse.json({
      success: true,
      count: products.length
    })
  } catch (error) {
    console.error('Error in /api/meli/sync-products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
