-- Crear tabla de histórico de análisis
CREATE TABLE IF NOT EXISTS product_ai_analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES meli_products(id) ON DELETE CASCADE,
  suggested_title TEXT,
  suggested_description TEXT,
  improvements_explanation TEXT,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 10),
  summary TEXT,
  keyword_analysis JSONB DEFAULT '[]'::jsonb,
  suggestions JSONB DEFAULT '{}'::jsonb,
  ai_provider VARCHAR(50),
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas rápidas por producto
CREATE INDEX IF NOT EXISTS idx_analysis_history_product_id
ON product_ai_analysis_history(product_id);

-- Índice para ordenar por fecha
CREATE INDEX IF NOT EXISTS idx_analysis_history_analyzed_at
ON product_ai_analysis_history(analyzed_at DESC);

-- Row Level Security
ALTER TABLE product_ai_analysis_history ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver el histórico de sus propios productos
CREATE POLICY "Users can view their own product analysis history"
ON product_ai_analysis_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM meli_products mp
    JOIN meli_connections mc ON mp.connection_id = mc.id
    WHERE mp.id = product_ai_analysis_history.product_id
    AND mc.user_id = auth.uid()
  )
);

-- Política: El sistema puede insertar registros (desde el backend)
CREATE POLICY "System can insert analysis history"
ON product_ai_analysis_history
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM meli_products mp
    JOIN meli_connections mc ON mp.connection_id = mc.id
    WHERE mp.id = product_ai_analysis_history.product_id
    AND mc.user_id = auth.uid()
  )
);

-- Comentarios
COMMENT ON TABLE product_ai_analysis_history IS 'Histórico completo de todos los análisis de IA realizados sobre productos';
COMMENT ON COLUMN product_ai_analysis_history.analyzed_at IS 'Momento en que se realizó este análisis específico';
