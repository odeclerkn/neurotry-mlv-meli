import { createClient } from '@/lib/supabase/server'
import { generateAuthUrl, generateState } from '@/lib/meli/oauth'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()

  // Verificar que el usuario esté autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Generar state para CSRF protection
  const state = generateState()

  // Guardar state en DB asociado al usuario
  const { error: stateError } = await supabase
    .from('oauth_states')
    .insert({
      state,
      user_id: user.id,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutos
    })

  if (stateError) {
    console.error('Error saving oauth state:', stateError)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  // Generar URL de autorización de MELI
  const authUrl = generateAuthUrl(state)

  // Redirigir a MELI
  return NextResponse.redirect(authUrl)
}
