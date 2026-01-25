import { createClient } from '@/lib/supabase/server'

export interface MeliConnection {
  id: string
  user_id: string
  meli_user_id: string
  access_token: string
  refresh_token: string
  expires_at: string
  is_active: boolean
  status: 'connected' | 'disconnected'
  site_id: string
  meli_nickname?: string | null
  meli_email?: string | null
  meli_first_name?: string | null
  meli_last_name?: string | null
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
  description: string | null
  is_new: boolean
  is_updated: boolean
  last_sync_at: string | null
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
  siteId = 'MLA',
  meliNickname,
  meliEmail,
  meliFirstName,
  meliLastName
}: {
  userId: string
  meliUserId: string
  accessToken: string
  refreshToken: string
  expiresIn: number
  siteId?: string
  meliNickname?: string
  meliEmail?: string
  meliFirstName?: string
  meliLastName?: string
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
      status: 'connected',
      site_id: siteId,
      meli_nickname: meliNickname,
      meli_email: meliEmail,
      meli_first_name: meliFirstName,
      meli_last_name: meliLastName,
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
 * Desconecta una conexión (invalida tokens pero mantiene los datos)
 */
export async function disconnectMeliConnection(connectionId: string, userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('meli_connections')
    .update({
      status: 'disconnected',
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', connectionId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error disconnecting MELI connection:', error)
    throw error
  }

  return data as MeliConnection
}

/**
 * Elimina completamente una conexión de MercadoLibre (borra todo)
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
 * Guarda o actualiza productos de una conexión con detección de cambios
 */
export async function saveMeliProducts(connectionId: string, products: any[]) {
  // Si no hay productos, retornar array vacío sin intentar guardar
  if (products.length === 0) {
    console.log('No hay productos para guardar')
    return []
  }

  const supabase = await createClient()
  const now = new Date().toISOString()

  // Primero, marcar todos los productos existentes como no nuevos/no actualizados
  await supabase
    .from('meli_products')
    .update({ is_new: false, is_updated: false })
    .eq('connection_id', connectionId)

  // Obtener productos existentes para comparar
  const { data: existingProducts } = await supabase
    .from('meli_products')
    .select('*')
    .eq('connection_id', connectionId)

  const existingMap = new Map(
    (existingProducts || []).map(p => [p.meli_product_id, p])
  )

  // Preparar datos con detección de cambios
  const productsData = products.map(product => {
    const existing = existingMap.get(product.id)
    const isNew = !existing

    let isUpdated = false
    if (existing && !isNew) {
      // Detectar cambios en campos importantes
      isUpdated =
        existing.title !== product.title ||
        existing.price !== product.price ||
        existing.available_quantity !== product.available_quantity ||
        existing.sold_quantity !== product.sold_quantity ||
        existing.status !== product.status
    }

    return {
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
      description: product.descriptions?.plain_text || product.subtitle || null,
      is_new: isNew,
      is_updated: isUpdated,
      last_sync_at: now,
      raw_data: product,
      updated_at: now
    }
  })

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
