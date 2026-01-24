import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { setActiveConnection, getMeliConnectionById } from '@/lib/meli/tokens'

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

    const { connectionId } = await request.json()

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID is required' },
        { status: 400 }
      )
    }

    // Verificar que la conexión esté conectada antes de activarla
    const connection = await getMeliConnectionById(connectionId)

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      )
    }

    if (connection.status === 'disconnected') {
      return NextResponse.json(
        { error: 'Cannot activate a disconnected account. Please reconnect first.' },
        { status: 400 }
      )
    }

    await setActiveConnection(user.id, connectionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in /api/meli/switch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
