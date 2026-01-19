-- ============================================
-- FASE 1B: Tablas para conexión con MercadoLibre
-- ============================================

-- Tabla de conexiones a MercadoLibre
CREATE TABLE public.meli_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Datos del usuario de MELI
  meli_user_id BIGINT NOT NULL,
  meli_nickname VARCHAR(255),

  -- Tokens (encriptados)
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

CREATE INDEX idx_meli_connections_user_id ON public.meli_connections(user_id);
CREATE INDEX idx_meli_connections_expires ON public.meli_connections(expires_at);

-- RLS para meli_connections
ALTER TABLE public.meli_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meli_connections"
ON public.meli_connections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meli_connections"
ON public.meli_connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meli_connections"
ON public.meli_connections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meli_connections"
ON public.meli_connections FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- Tabla de estados OAuth (para CSRF protection)
-- ============================================

CREATE TABLE public.oauth_states (
  state VARCHAR(64) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_oauth_states_expires ON public.oauth_states(expires_at);
CREATE INDEX idx_oauth_states_user_id ON public.oauth_states(user_id);

-- RLS para oauth_states
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own oauth_states"
ON public.oauth_states FOR ALL
USING (auth.uid() = user_id);
