import { createClient } from '@/lib/supabase/server'

export interface MeliConnection {
  id: string
  user_id: string
  meli_user_id: string
  access_token: string
  refresh_token: string
  expires_at: string
  is_active: boolean
  site_id: string
  created_at: string
  updated_at: string
}

export interface MeliProduct {
  id: string
  connection_id: string
  meli_product_id: string
  title: string
  price: number | null
  available_quantity: number | null
  sold_quantity: number | null
  status: string | null
  permalink: string | null
  thumbnail: string | null
  category_id: string | null
  listing_type_id: string | null
  raw_data: any
  created_at: string
  updated_at: string
}

/**
 * Guarda o actualiza una conexión de MercadoLibre
 */
export async function saveMeliConnection({
  userId,
  meliUserId,
  accessToken,
  refreshToken,
  expiresIn,
  siteId = 'MLA'
}: {
  userId: string
  meliUserId: string
  accessToken: string
  refreshToken: string
  expiresIn: number
  siteId?: string
}) {
  const supabase = await createClient()

  const expiresAt = new Date(Date.now() + expiresIn * 1000)

  // Primero, desactivar todas las otras conexiones del usuario
  await supabase
    .from('meli_connections')
    .update({ is_active: false })
    .eq('user_id', userId)

  // Luego, insertar o actualizar la conexión actual
  const { data, error } = await supabase
    .from('meli_connections')
    .upsert({
      user_id: userId,
      meli_user_id: meliUserId,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt.toISOString(),
      is_active: true,
      site_id: siteId,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,meli_user_id'
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving MELI connection:', error)
    throw error
  }

  return data as MeliConnection
}

/**
 * Obtiene la conexión activa de MercadoLibre del usuario
 */
export async function getActiveMeliConnection(userId: string): Promise<MeliConnection | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('meli_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // No encontrado
    }
    console.error('Error getting active MELI connection:', error)
    throw error
  }

  return data as MeliConnection
}

/**
 * Obtiene todas las conexiones de MercadoLibre del usuario
 */
export async function getAllMeliConnections(userId: string): Promise<MeliConnection[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('meli_connections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error getting all MELI connections:', error)
    throw error
  }

  return data as MeliConnection[]
}

/**
 * Obtiene una conexión específica por ID
 */
export async function getMeliConnectionById(connectionId: string): Promise<MeliConnection | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('meli_connections')
    .select('*')
    .eq('id', connectionId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error getting MELI connection by ID:', error)
    throw error
  }

  return data as MeliConnection
}

/**
 * Actualiza los tokens de una conexión
 */
export async function updateMeliTokens({
  connectionId,
  accessToken,
  refreshToken,
  expiresIn
}: {
  connectionId: string
  accessToken: string
  refreshToken: string
  expiresIn: number
}) {
  const supabase = await createClient()

  const expiresAt = new Date(Date.now() + expiresIn * 1000)

  const { data, error } = await supabase
    .from('meli_connections')
    .update({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', connectionId)
    .select()
    .single()

  if (error) {
    console.error('Error updating MELI tokens:', error)
    throw error
  }

  return data as MeliConnection
}

/**
 * Cambia la cuenta activa del usuario
 */
export async function setActiveConnection(userId: string, connectionId: string) {
  const supabase = await createClient()

  // Desactivar todas las conexiones del usuario
  await supabase
    .from('meli_connections')
    .update({ is_active: false })
    .eq('user_id', userId)

  // Activar la conexión seleccionada
  const { data, error } = await supabase
    .from('meli_connections')
    .update({ is_active: true })
    .eq('id', connectionId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error setting active connection:', error)
    throw error
  }

  return data as MeliConnection
}

/**
 * Elimina una conexión de MercadoLibre
 */
export async function deleteMeliConnection(connectionId: string, userId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('meli_connections')
    .delete()
    .eq('id', connectionId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting MELI connection:', error)
    throw error
  }
}

/**
 * Guarda o actualiza productos de una conexión
 */
export async function saveMeliProducts(connectionId: string, products: any[]) {
  const supabase = await createClient()

  const productsData = products.map(product => ({
    connection_id: connectionId,
    meli_product_id: product.id,
    title: product.title,
    price: product.price,
    available_quantity: product.available_quantity,
    sold_quantity: product.sold_quantity,
    status: product.status,
    permalink: product.permalink,
    thumbnail: product.thumbnail,
    category_id: product.category_id,
    listing_type_id: product.listing_type_id,
    raw_data: product,
    updated_at: new Date().toISOString()
  }))

  const { data, error } = await supabase
    .from('meli_products')
    .upsert(productsData, {
      onConflict: 'connection_id,meli_product_id'
    })
    .select()

  if (error) {
    console.error('Error saving MELI products:', error)
    throw error
  }

  return data as MeliProduct[]
}

/**
 * Obtiene todos los productos de una conexión
 */
export async function getMeliProducts(connectionId: string): Promise<MeliProduct[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('meli_products')
    .select('*')
    .eq('connection_id', connectionId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error getting MELI products:', error)
    throw error
  }

  return data as MeliProduct[]
}

/**
 * Obtiene todos los productos del usuario (de todas sus conexiones)
 */
export async function getAllUserMeliProducts(userId: string): Promise<MeliProduct[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('meli_products')
    .select(`
      *,
      connection:meli_connections!inner(user_id)
    `)
    .eq('connection.user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error getting all user MELI products:', error)
    throw error
  }

  return data as MeliProduct[]
}
