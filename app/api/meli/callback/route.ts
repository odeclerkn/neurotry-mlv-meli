import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens } from '@/lib/meli/client'
import { saveMeliConnection } from '@/lib/meli/tokens'

export async function GET(request: NextRequest) {
  try {
    console.log('=== MELI CALLBACK INICIADO ===')
    console.log('URL completa:', request.url)

    // Determinar la URL base para las redirecciones
    // Si viene de ngrok, usar el host de ngrok
    const forwardedHost = request.headers.get('x-forwarded-host')
    const forwardedProto = request.headers.get('x-forwarded-proto')
    const host = forwardedHost || request.headers.get('host') || 'localhost:3000'
    const protocol = forwardedProto || (host.includes('localhost') ? 'http' : 'https')
    const baseUrl = `${protocol}://${host}`

    console.log('Base URL para redirección:', baseUrl)

    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    console.log('Code recibido:', code ? 'SÍ' : 'NO')
    console.log('Error recibido:', error || 'NO')

    // Si el usuario rechazó la autorización
    if (error) {
      console.log('Usuario rechazó la autorización:', error)
      return NextResponse.redirect(`${baseUrl}/dashboard?meli_error=denied`)
    }

    if (!code) {
      console.log('No se recibió código de autorización')
      return NextResponse.redirect(`${baseUrl}/dashboard?meli_error=no_code`)
    }

    // Verificar autenticación
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('Usuario no autenticado, redirigiendo a login')
      return NextResponse.redirect(`${baseUrl}/login`)
    }

    console.log('Usuario autenticado:', user.id)

    // Recuperar el code_verifier de la cookie
    const codeVerifier = request.cookies.get('meli_code_verifier')?.value

    if (!codeVerifier) {
      console.log('Code verifier no encontrado en cookie')
      return NextResponse.redirect(`${baseUrl}/dashboard?meli_error=no_verifier`)
    }

    console.log('Code verifier recuperado de cookie:', codeVerifier ? '***' + codeVerifier.slice(-4) : 'ERROR')

    // Obtener credenciales de MELI
    const clientId = process.env.MELI_CLIENT_ID
    const clientSecret = process.env.MELI_CLIENT_SECRET
    const redirectUri = process.env.MELI_REDIRECT_URI

    console.log('Configuración MELI:')
    console.log('- CLIENT_ID:', clientId ? 'PRESENTE' : 'FALTANTE')
    console.log('- CLIENT_SECRET:', clientSecret ? 'PRESENTE' : 'FALTANTE')
    console.log('- REDIRECT_URI:', redirectUri)

    if (!clientId || !clientSecret || !redirectUri) {
      console.log('Faltan credenciales de MELI en .env.local')
      return NextResponse.redirect(`${baseUrl}/dashboard?meli_error=config`)
    }

    // Intercambiar código por tokens
    console.log('Intercambiando código por tokens...')
    const { accessToken, refreshToken, expiresIn, userId: meliUserId } =
      await exchangeCodeForTokens({
        code,
        clientId,
        clientSecret,
        redirectUri,
        codeVerifier
      })

    console.log('Tokens obtenidos exitosamente')
    console.log('- MELI User ID:', meliUserId)
    console.log('- Access Token:', accessToken ? 'PRESENTE' : 'FALTANTE')
    console.log('- Refresh Token:', refreshToken ? 'PRESENTE' : 'FALTANTE')

    // Guardar conexión en la base de datos
    console.log('Guardando conexión en la base de datos...')
    await saveMeliConnection({
      userId: user.id,
      meliUserId: String(meliUserId),
      accessToken,
      refreshToken,
      expiresIn,
      siteId: 'MLA' // Argentina
    })

    console.log('Conexión guardada exitosamente')
    console.log('Redirigiendo a:', `${baseUrl}/dashboard?meli_success=true`)

    // Redirigir al dashboard con éxito
    const response = NextResponse.redirect(`${baseUrl}/dashboard?meli_success=true`)

    // Limpiar la cookie del code_verifier
    response.cookies.delete('meli_code_verifier')

    return response
  } catch (error) {
    console.error('=== ERROR EN CALLBACK ===')
    console.error('Error completo:', error)
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack')

    // Determinar la URL base para redirección en caso de error
    const forwardedHost = request.headers.get('x-forwarded-host')
    const forwardedProto = request.headers.get('x-forwarded-proto')
    const host = forwardedHost || request.headers.get('host') || 'localhost:3000'
    const protocol = forwardedProto || (host.includes('localhost') ? 'http' : 'https')
    const baseUrl = `${protocol}://${host}`

    // Capturar el mensaje de error para mostrarlo al usuario
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const encodedError = encodeURIComponent(errorMessage)

    const response = NextResponse.redirect(`${baseUrl}/dashboard?meli_error=${encodedError}`)

    // Limpiar la cookie del code_verifier en caso de error
    response.cookies.delete('meli_code_verifier')

    return response
  }
}
