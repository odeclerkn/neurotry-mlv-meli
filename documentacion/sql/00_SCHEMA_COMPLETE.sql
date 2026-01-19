-- ============================================
-- SCHEMA COMPLETO - MLP Optimizador MELI
-- ============================================
-- Este archivo contiene TODOS los schemas del proyecto
-- Ejecuta este archivo si quieres crear todas las tablas de una vez
--
-- ORDEN DE EJECUCIÓN:
-- 1. Perfiles de usuarios (Fase 1A)
-- 2. Conexiones MELI (Fase 1B)
-- 3. Productos (Fase 2 - Opcional)
-- ============================================

-- ============================================
-- PARTE 1: PERFILES DE USUARIOS (Fase 1A)
-- ============================================

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile"
ON public.profiles FOR DELETE
USING (auth.uid() = id);

-- Trigger para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PARTE 2: CONEXIONES MERCADOLIBRE (Fase 1B)
-- ============================================

-- Tabla de conexiones a MercadoLibre
CREATE TABLE IF NOT EXISTS public.meli_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meli_user_id BIGINT NOT NULL,
  meli_nickname VARCHAR(255),
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_meli_connections_user_id ON public.meli_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_meli_connections_expires ON public.meli_connections(expires_at);
CREATE INDEX IF NOT EXISTS idx_meli_connections_meli_user_id ON public.meli_connections(meli_user_id);

-- RLS
ALTER TABLE public.meli_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own meli_connections" ON public.meli_connections;
CREATE POLICY "Users can view own meli_connections"
ON public.meli_connections FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own meli_connections" ON public.meli_connections;
CREATE POLICY "Users can insert own meli_connections"
ON public.meli_connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own meli_connections" ON public.meli_connections;
CREATE POLICY "Users can update own meli_connections"
ON public.meli_connections FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own meli_connections" ON public.meli_connections;
CREATE POLICY "Users can delete own meli_connections"
ON public.meli_connections FOR DELETE
USING (auth.uid() = user_id);

-- Tabla de estados OAuth
CREATE TABLE IF NOT EXISTS public.oauth_states (
  state VARCHAR(64) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON public.oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_states_user_id ON public.oauth_states(user_id);

-- RLS
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own oauth_states" ON public.oauth_states;
CREATE POLICY "Users can manage own oauth_states"
ON public.oauth_states FOR ALL
USING (auth.uid() = user_id);

-- Función de limpieza
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM public.oauth_states WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PARTE 3: PRODUCTOS (Fase 2 - OPCIONAL)
-- ============================================

-- Tabla de productos
CREATE TABLE IF NOT EXISTS public.products (
  id VARCHAR(50) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12, 2),
  original_price DECIMAL(12, 2),
  currency_id VARCHAR(10),
  sold_quantity INTEGER DEFAULT 0,
  available_quantity INTEGER DEFAULT 0,
  status VARCHAR(50),
  category_id VARCHAR(50),
  category_name VARCHAR(255),
  listing_type_id VARCHAR(50),
  permalink TEXT,
  thumbnail TEXT,
  optimization_score INTEGER,
  missing_keywords JSONB,
  suggested_title TEXT,
  suggested_description TEXT,
  raw_data JSONB,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  analyzed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_score ON public.products(optimization_score);
CREATE INDEX IF NOT EXISTS idx_products_synced ON public.products(synced_at);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);

-- RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own products" ON public.products;
CREATE POLICY "Users can view own products"
ON public.products FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own products" ON public.products;
CREATE POLICY "Users can insert own products"
ON public.products FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own products" ON public.products;
CREATE POLICY "Users can update own products"
ON public.products FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own products" ON public.products;
CREATE POLICY "Users can delete own products"
ON public.products FOR DELETE
USING (auth.uid() = user_id);

-- Funciones auxiliares
CREATE OR REPLACE FUNCTION public.get_products_needing_analysis(p_user_id UUID)
RETURNS SETOF public.products AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.products
  WHERE user_id = p_user_id
    AND (analyzed_at IS NULL OR analyzed_at < synced_at)
    AND status = 'active'
  ORDER BY sold_quantity DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_product_stats(p_user_id UUID)
RETURNS TABLE (
  total_products BIGINT,
  active_products BIGINT,
  avg_optimization_score NUMERIC,
  total_sold BIGINT,
  needs_analysis BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT,
    AVG(optimization_score),
    SUM(sold_quantity)::BIGINT,
    COUNT(*) FILTER (WHERE analyzed_at IS NULL OR analyzed_at < synced_at)::BIGINT
  FROM public.products
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FIN DEL SCHEMA COMPLETO
-- ============================================

-- Para verificar que todo se creó correctamente:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
