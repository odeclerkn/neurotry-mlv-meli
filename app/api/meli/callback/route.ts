import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens } from '@/lib/meli/oauth'
import { encrypt } from '@/lib/encryption'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/dashboard?error=missing_params', request.url)
    )
  }

  const supabase = await createClient()

  // Validar state (CSRF protection)
  const { data: oauthState, error: stateError } = await supabase
    .from('oauth_states')
    .select('user_id, expires_at')
    .eq('state', state)
    .single()

  if (stateError || !oauthState) {
    return NextResponse.redirect(
      new URL('/dashboard?error=invalid_state', request.url)
    )
  }

  // Verificar que no haya expirado
  if (new Date(oauthState.expires_at) < new Date()) {
    return NextResponse.redirect(
      new URL('/dashboard?error=state_expired', request.url)
    )
  }

  try {
    // Intercambiar code por tokens
    const tokens = await exchangeCodeForTokens(code)

    // Encriptar tokens
    const accessTokenEncrypted = encrypt(tokens.access_token)
    const refreshTokenEncrypted = encrypt(tokens.refresh_token)
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    // Guardar en DB
    const { error: insertError } = await supabase
      .from('meli_connections')
      .upsert({
        user_id: oauthState.user_id,
        meli_user_id: tokens.user_id,
        access_token_encrypted: accessTokenEncrypted,
        refresh_token_encrypted: refreshTokenEncrypted,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })

    if (insertError) {
      console.error('Error saving tokens:', insertError)
      throw insertError
    }

    // Limpiar state usado
    await supabase.from('oauth_states').delete().eq('state', state)

    // Redirigir al dashboard con éxito
    return NextResponse.redirect(
      new URL('/dashboard?meli_connected=true', request.url)
    )
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/dashboard?error=connection_failed', request.url)
    )
  }
}
