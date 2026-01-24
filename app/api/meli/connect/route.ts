import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMeliAuthUrl } from '@/lib/meli/client'

export async function GET() {
  try {
    console.log('=== MELI CONNECT INICIADO ===')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('Usuario no autenticado')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Usuario autenticado:', user.id)

    const clientId = process.env.MELI_CLIENT_ID
    const redirectUri = process.env.MELI_REDIRECT_URI

    console.log('Configuración MELI:')
    console.log('- CLIENT_ID:', clientId)
    console.log('- REDIRECT_URI:', redirectUri)

    if (!clientId || !redirectUri) {
      console.log('Credenciales de MELI no configuradas')
      return NextResponse.json(
        { error: 'MELI credentials not configured' },
        { status: 500 }
      )
    }

    const { authUrl, codeVerifier } = getMeliAuthUrl(redirectUri, clientId)

    console.log('URL de autorización generada:', authUrl)
    console.log('Code verifier generado:', codeVerifier ? '***' + codeVerifier.slice(-4) : 'ERROR')
    console.log('Redirigiendo a MercadoLibre...')

    // Guardar el code_verifier en una cookie para recuperarlo en el callback
    const response = NextResponse.redirect(authUrl)
    response.cookies.set('meli_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutos
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Error in /api/meli/connect:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
