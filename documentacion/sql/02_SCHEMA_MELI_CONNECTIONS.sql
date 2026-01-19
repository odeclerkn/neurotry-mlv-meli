-- ============================================
-- FASE 1B: Conexiones con MercadoLibre
-- ============================================
-- Este schema debe ejecutarse DESPUÉS de 01_SCHEMA_PROFILES.sql
-- Crea las tablas necesarias para OAuth con MercadoLibre
-- ============================================

-- ============================================
-- Tabla de conexiones a MercadoLibre
-- ============================================

CREATE TABLE IF NOT EXISTS public.meli_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Datos del usuario de MELI
  meli_user_id BIGINT NOT NULL,
  meli_nickname VARCHAR(255),

  -- Tokens (encriptados con AES-256)
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Metadata
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,

  -- Un usuario solo puede conectar una cuenta MELI
  UNIQUE(user_id)
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_meli_connections_user_id ON public.meli_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_meli_connections_expires ON public.meli_connections(expires_at);
CREATE INDEX IF NOT EXISTS idx_meli_connections_meli_user_id ON public.meli_connections(meli_user_id);

-- ============================================
-- Row Level Security para meli_connections
-- ============================================

ALTER TABLE public.meli_connections ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios solo pueden ver sus propias conexiones
DROP POLICY IF EXISTS "Users can view own meli_connections" ON public.meli_connections;
CREATE POLICY "Users can view own meli_connections"
ON public.meli_connections FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Los usuarios pueden insertar sus propias conexiones
DROP POLICY IF EXISTS "Users can insert own meli_connections" ON public.meli_connections;
CREATE POLICY "Users can insert own meli_connections"
ON public.meli_connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Los usuarios pueden actualizar sus propias conexiones
DROP POLICY IF EXISTS "Users can update own meli_connections" ON public.meli_connections;
CREATE POLICY "Users can update own meli_connections"
ON public.meli_connections FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Los usuarios pueden eliminar sus propias conexiones
DROP POLICY IF EXISTS "Users can delete own meli_connections" ON public.meli_connections;
CREATE POLICY "Users can delete own meli_connections"
ON public.meli_connections FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- Tabla de estados OAuth (CSRF protection)
-- ============================================

CREATE TABLE IF NOT EXISTS public.oauth_states (
  state VARCHAR(64) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON public.oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_states_user_id ON public.oauth_states(user_id);

-- ============================================
-- Row Level Security para oauth_states
-- ============================================

ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios pueden gestionar sus propios estados
DROP POLICY IF EXISTS "Users can manage own oauth_states" ON public.oauth_states;
CREATE POLICY "Users can manage own oauth_states"
ON public.oauth_states FOR ALL
USING (auth.uid() = user_id);

-- ============================================
-- Función de limpieza de estados expirados
-- ============================================

-- Función para limpiar states expirados (ejecutar con cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM public.oauth_states
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario para recordar configurar cron (opcional)
COMMENT ON FUNCTION public.cleanup_expired_oauth_states() IS
'Limpia estados OAuth expirados. Ejecutar periódicamente con pg_cron o manualmente.';

-- ============================================
-- Verificación
-- ============================================
-- Después de ejecutar este script, verifica:
-- 1. Tabla 'meli_connections' existe en Table Editor
-- 2. Tabla 'oauth_states' existe en Table Editor
-- 3. Todas las políticas RLS están activas
-- 4. Índices creados correctamente
-- ============================================
