-- Crear tabla para almacenar conexiones de MercadoLibre
CREATE TABLE IF NOT EXISTS public.meli_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  meli_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  site_id TEXT DEFAULT 'MLA',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, meli_user_id)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_meli_connections_user_id ON public.meli_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_meli_connections_meli_user_id ON public.meli_connections(meli_user_id);
CREATE INDEX IF NOT EXISTS idx_meli_connections_is_active ON public.meli_connections(is_active);

-- Habilitar Row Level Security
ALTER TABLE public.meli_connections ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver sus propias conexiones
CREATE POLICY "Users can view their own connections"
  ON public.meli_connections
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para que los usuarios solo puedan insertar sus propias conexiones
CREATE POLICY "Users can insert their own connections"
  ON public.meli_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios solo puedan actualizar sus propias conexiones
CREATE POLICY "Users can update their own connections"
  ON public.meli_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Política para que los usuarios solo puedan eliminar sus propias conexiones
CREATE POLICY "Users can delete their own connections"
  ON public.meli_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comentarios
COMMENT ON TABLE public.meli_connections IS 'Almacena las conexiones OAuth de MercadoLibre de los usuarios';
COMMENT ON COLUMN public.meli_connections.meli_user_id IS 'ID del usuario en MercadoLibre';
COMMENT ON COLUMN public.meli_connections.access_token IS 'Token de acceso OAuth de MercadoLibre';
COMMENT ON COLUMN public.meli_connections.refresh_token IS 'Token de refresco OAuth de MercadoLibre';
COMMENT ON COLUMN public.meli_connections.expires_at IS 'Fecha y hora de expiración del access_token';
COMMENT ON COLUMN public.meli_connections.is_active IS 'Indica si esta es la conexión activa del usuario';
COMMENT ON COLUMN public.meli_connections.site_id IS 'ID del sitio de MercadoLibre (MLA=Argentina, MLM=México, etc.)';
