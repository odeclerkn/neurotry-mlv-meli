import crypto from 'crypto'
import axios from 'axios'

const MELI_AUTH_URL = 'https://auth.mercadolibre.com.mx/authorization'
const MELI_TOKEN_URL = 'https://api.mercadolibre.com/oauth/token'

export interface MeliTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  user_id: number
}

export function generateAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.MELI_CLIENT_ID!,
    redirect_uri: process.env.MELI_REDIRECT_URI!,
    state,
  })

  return `${MELI_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string): Promise<MeliTokens> {
  const response = await axios.post(
    MELI_TOKEN_URL,
    {
      grant_type: 'authorization_code',
      client_id: process.env.MELI_CLIENT_ID!,
      client_secret: process.env.MELI_CLIENT_SECRET!,
      code,
      redirect_uri: process.env.MELI_REDIRECT_URI!,
    },
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  return response.data
}

export async function refreshAccessToken(refreshToken: string): Promise<MeliTokens> {
  const response = await axios.post(
    MELI_TOKEN_URL,
    {
      grant_type: 'refresh_token',
      client_id: process.env.MELI_CLIENT_ID!,
      client_secret: process.env.MELI_CLIENT_SECRET!,
      refresh_token: refreshToken,
    },
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  return response.data
}

export function generateState(): string {
  return crypto.randomBytes(32).toString('hex')
}
