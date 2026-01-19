-- ============================================
-- FASE 2: Productos sincronizados de MercadoLibre
-- ============================================
-- Este schema es OPCIONAL para fase 1
-- Se usará cuando implementemos sincronización de productos
-- Ejecutar DESPUÉS de 02_SCHEMA_MELI_CONNECTIONS.sql
-- ============================================

-- ============================================
-- Tabla de productos sincronizados
-- ============================================

CREATE TABLE IF NOT EXISTS public.products (
  id VARCHAR(50) PRIMARY KEY,  -- MLM123456789
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Datos básicos del producto
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12, 2),
  original_price DECIMAL(12, 2),
  currency_id VARCHAR(10),

  -- Ventas y disponibilidad
  sold_quantity INTEGER DEFAULT 0,
  available_quantity INTEGER DEFAULT 0,
  status VARCHAR(50),  -- active, paused, closed

  -- Categoría y clasificación
  category_id VARCHAR(50),
  category_name VARCHAR(255),
  listing_type_id VARCHAR(50),  -- gold_special, gold_pro, free

  -- URLs e imágenes
  permalink TEXT,
  thumbnail TEXT,

  -- Análisis de optimización (calculado por la app)
  optimization_score INTEGER,  -- 0-100
  missing_keywords JSONB,
  suggested_title TEXT,
  suggested_description TEXT,

  -- Metadata
  raw_data JSONB,  -- Respuesta completa de MELI API
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  analyzed_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_score ON public.products(optimization_score);
CREATE INDEX IF NOT EXISTS idx_products_synced ON public.products(synced_at);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios solo pueden ver sus propios productos
DROP POLICY IF EXISTS "Users can view own products" ON public.products;
CREATE POLICY "Users can view own products"
ON public.products FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Los usuarios pueden insertar sus propios productos
DROP POLICY IF EXISTS "Users can insert own products" ON public.products;
CREATE POLICY "Users can insert own products"
ON public.products FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Los usuarios pueden actualizar sus propios productos
DROP POLICY IF EXISTS "Users can update own products" ON public.products;
CREATE POLICY "Users can update own products"
ON public.products FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Los usuarios pueden eliminar sus propios productos
DROP POLICY IF EXISTS "Users can delete own products" ON public.products;
CREATE POLICY "Users can delete own products"
ON public.products FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- Funciones útiles
-- ============================================

-- Función para obtener productos que necesitan análisis
CREATE OR REPLACE FUNCTION public.get_products_needing_analysis(p_user_id UUID)
RETURNS SETOF public.products AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.products
  WHERE user_id = p_user_id
    AND (analyzed_at IS NULL OR analyzed_at < synced_at)
    AND status = 'active'
  ORDER BY sold_quantity DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas de productos
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
    COUNT(*)::BIGINT as total_products,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT as active_products,
    AVG(optimization_score) as avg_optimization_score,
    SUM(sold_quantity)::BIGINT as total_sold,
    COUNT(*) FILTER (WHERE analyzed_at IS NULL OR analyzed_at < synced_at)::BIGINT as needs_analysis
  FROM public.products
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Verificación
-- ============================================
-- Después de ejecutar este script, verifica:
-- 1. Tabla 'products' existe en Table Editor
-- 2. Políticas RLS están activas
-- 3. Funciones auxiliares creadas
-- 4. Índices funcionando correctamente
-- ============================================

-- ============================================
-- NOTA: Esta tabla es para FASES FUTURAS
-- No es necesaria para probar la conexión con MELI
-- ============================================
