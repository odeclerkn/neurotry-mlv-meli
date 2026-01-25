import { getMeliConnectionById, updateMeliTokens } from './tokens'
import crypto from 'crypto'

// URLs de MercadoLibre Argentina
const MELI_AUTH_URL = 'https://auth.mercadolibre.com.ar/authorization'
const MELI_TOKEN_URL = 'https://api.mercadolibre.com/oauth/token'
const MELI_API_URL = 'https://api.mercadolibre.com'

/**
 * Genera un code_verifier aleatorio para PKCE
 */
function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Genera el code_challenge a partir del code_verifier
 */
function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url')
}

/**
 * Construye la URL de autorización de MercadoLibre con PKCE
 * Retorna tanto la URL como el code_verifier que debe guardarse
 */
export function getMeliAuthUrl(redirectUri: string, clientId: string): { authUrl: string; codeVerifier: string } {
  // Generar code_verifier y code_challenge para PKCE
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = generateCodeChallenge(codeVerifier)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    // Fuerza a MercadoLibre a pedir credenciales SIEMPRE, incluso si ya está logueado
    prompt: 'login',
    // PKCE parameters
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  })

  return {
    authUrl: `${MELI_AUTH_URL}?${params.toString()}`,
    codeVerifier
  }
}

/**
 * Intercambia el código de autorización por tokens
 */
export async function exchangeCodeForTokens({
  code,
  clientId,
  clientSecret,
  redirectUri,
  codeVerifier
}: {
  code: string
  clientId: string
  clientSecret: string
  redirectUri: string
  codeVerifier: string
}) {
  console.log('=== INTERCAMBIANDO CÓDIGO POR TOKENS ===')
  console.log('Parámetros enviados a MercadoLibre:')
  console.log('- grant_type: authorization_code')
  console.log('- client_id:', clientId)
  console.log('- client_secret:', clientSecret ? '***' + clientSecret.slice(-4) : 'FALTANTE')
  console.log('- code:', code)
  console.log('- redirect_uri:', redirectUri)
  console.log('- code_verifier:', codeVerifier ? '***' + codeVerifier.slice(-4) : 'FALTANTE')

  const response = await fetch(MELI_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    })
  })

  console.log('Respuesta de MercadoLibre:', response.status)

  if (!response.ok) {
    const errorText = await response.text()
    console.error('ERROR en respuesta de MercadoLibre:')
    console.error('Status:', response.status)
    console.error('Body:', errorText)

    // Intentar parsear el error como JSON
    let errorDetail = errorText
    try {
      const errorJson = JSON.parse(errorText)
      errorDetail = JSON.stringify(errorJson)
    } catch {
      // Si no es JSON, usar el texto tal cual
    }

    throw new Error(`MELI Error ${response.status}: ${errorDetail}`)
  }

  const data = await response.json()
  console.log('Tokens obtenidos exitosamente')

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    userId: data.user_id,
    scope: data.scope
  }
}

/**
 * Refresca el access token usando el refresh token
 */
export async function refreshAccessToken({
  refreshToken,
  clientId,
  clientSecret
}: {
  refreshToken: string
  clientId: string
  clientSecret: string
}) {
  const response = await fetch(MELI_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Error refreshing token:', error)
    throw new Error(`Failed to refresh token: ${response.status}`)
  }

  const data = await response.json()

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in
  }
}

/**
 * Obtiene un access token válido, refrescándolo si es necesario
 */
export async function getValidAccessToken(connectionId: string): Promise<string> {
  const connection = await getMeliConnectionById(connectionId)

  if (!connection) {
    throw new Error('Connection not found')
  }

  const now = new Date()
  const expiresAt = new Date(connection.expires_at)

  // Si el token expira en menos de 5 minutos, refrescarlo
  const shouldRefresh = expiresAt.getTime() - now.getTime() < 5 * 60 * 1000

  if (shouldRefresh) {
    const clientId = process.env.MELI_CLIENT_ID
    const clientSecret = process.env.MELI_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error('MELI credentials not configured')
    }

    const { accessToken, refreshToken, expiresIn } = await refreshAccessToken({
      refreshToken: connection.refresh_token,
      clientId,
      clientSecret
    })

    await updateMeliTokens({
      connectionId,
      accessToken,
      refreshToken,
      expiresIn
    })

    return accessToken
  }

  return connection.access_token
}

/**
 * Obtiene información del usuario de MercadoLibre
 */
export async function getMeliUserInfo(accessToken: string) {
  const response = await fetch(`${MELI_API_URL}/users/me`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Error getting user info:', error)
    throw new Error(`Failed to get user info: ${response.status}`)
  }

  return response.json()
}

/**
 * Obtiene los productos del usuario de MercadoLibre
 */
export async function getMeliUserItems(userId: string, accessToken: string) {
  const response = await fetch(
    `${MELI_API_URL}/users/${userId}/items/search?status=active&limit=50`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error('Error getting user items:', error)
    throw new Error(`Failed to get user items: ${response.status}`)
  }

  const data = await response.json()
  return data.results || []
}

/**
 * Obtiene información detallada de múltiples productos
 */
export async function getMeliItemsDetails(itemIds: string[], accessToken: string) {
  if (itemIds.length === 0) {
    return []
  }

  // MELI permite obtener hasta 20 items por request
  const chunks: string[][] = []
  for (let i = 0; i < itemIds.length; i += 20) {
    chunks.push(itemIds.slice(i, i + 20))
  }

  const allItems = []

  for (const chunk of chunks) {
    const ids = chunk.join(',')
    const response = await fetch(
      `${MELI_API_URL}/items?ids=${ids}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    if (!response.ok) {
      console.error(`Error getting items details for chunk: ${response.status}`)
      continue
    }

    const data = await response.json()

    // La respuesta es un array de objetos con { code, body }
    const items = data
      .filter((item: any) => item.code === 200)
      .map((item: any) => item.body)

    allItems.push(...items)
  }

  return allItems
}

/**
 * Obtiene la descripción de un producto
 */
export async function getMeliItemDescription(itemId: string, accessToken: string) {
  try {
    const response = await fetch(
      `${MELI_API_URL}/items/${itemId}/description`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.plain_text || data.text || null
  } catch (error) {
    console.error(`Error getting description for item ${itemId}:`, error)
    return null
  }
}

/**
 * Sincroniza los productos de una conexión
 */
export async function syncMeliProducts(connectionId: string) {
  const connection = await getMeliConnectionById(connectionId)

  if (!connection) {
    throw new Error('Connection not found')
  }

  const accessToken = await getValidAccessToken(connectionId)

  // Obtener IDs de productos
  const itemIds = await getMeliUserItems(connection.meli_user_id, accessToken)

  // Obtener detalles de productos
  const items = await getMeliItemsDetails(itemIds, accessToken)

  // Obtener descripciones de productos (en paralelo, máximo 5 a la vez)
  console.log(`Obteniendo descripciones de ${items.length} productos...`)
  for (let i = 0; i < items.length; i += 5) {
    const chunk = items.slice(i, i + 5)
    const descriptions = await Promise.all(
      chunk.map(item => getMeliItemDescription(item.id, accessToken))
    )

    chunk.forEach((item, idx) => {
      item.description = descriptions[idx]
    })
  }

  return items
}
