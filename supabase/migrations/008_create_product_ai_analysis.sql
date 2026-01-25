-- Crear tabla para guardar análisis de IA de productos
CREATE TABLE IF NOT EXISTS product_ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES meli_products(id) ON DELETE CASCADE,

  -- Sugerencias generadas por IA
  suggested_title TEXT,
  suggested_description TEXT,
  improvements_explanation TEXT,

  -- Scoring y análisis
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 10),
  summary TEXT,

  -- Análisis detallado de keywords (JSON)
  keyword_analysis JSONB DEFAULT '[]'::jsonb,

  -- Sugerencias adicionales (JSON)
  suggestions JSONB DEFAULT '{}'::jsonb,

  -- Análisis de competidores (JSON)
  competitor_analysis JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  ai_provider VARCHAR(50), -- 'anthropic', 'openai', 'gemini', 'basic'
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Un producto solo puede tener un análisis activo (el más reciente)
  UNIQUE(product_id)
);

-- Índices para mejorar performance
CREATE INDEX idx_product_ai_analysis_product_id ON product_ai_analysis(product_id);
CREATE INDEX idx_product_ai_analysis_score ON product_ai_analysis(overall_score);
CREATE INDEX idx_product_ai_analysis_provider ON product_ai_analysis(ai_provider);
CREATE INDEX idx_product_ai_analysis_analyzed_at ON product_ai_analysis(analyzed_at DESC);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_product_ai_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_ai_analysis_updated_at
  BEFORE UPDATE ON product_ai_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_product_ai_analysis_updated_at();

-- RLS (Row Level Security)
ALTER TABLE product_ai_analysis ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios solo pueden ver análisis de sus propios productos
CREATE POLICY "Users can view their own product analysis"
  ON product_ai_analysis
  FOR SELECT
  USING (
    product_id IN (
      SELECT mp.id
      FROM meli_products mp
      JOIN meli_connections mc ON mp.connection_id = mc.id
      WHERE mc.user_id = auth.uid()
    )
  );

-- Policy: Los usuarios pueden insertar análisis de sus propios productos
CREATE POLICY "Users can insert analysis for their own products"
  ON product_ai_analysis
  FOR INSERT
  WITH CHECK (
    product_id IN (
      SELECT mp.id
      FROM meli_products mp
      JOIN meli_connections mc ON mp.connection_id = mc.id
      WHERE mc.user_id = auth.uid()
    )
  );

-- Policy: Los usuarios pueden actualizar análisis de sus propios productos
CREATE POLICY "Users can update their own product analysis"
  ON product_ai_analysis
  FOR UPDATE
  USING (
    product_id IN (
      SELECT mp.id
      FROM meli_products mp
      JOIN meli_connections mc ON mp.connection_id = mc.id
      WHERE mc.user_id = auth.uid()
    )
  );

-- Policy: Los usuarios pueden eliminar análisis de sus propios productos
CREATE POLICY "Users can delete their own product analysis"
  ON product_ai_analysis
  FOR DELETE
  USING (
    product_id IN (
      SELECT mp.id
      FROM meli_products mp
      JOIN meli_connections mc ON mp.connection_id = mc.id
      WHERE mc.user_id = auth.uid()
    )
  );

-- Comentarios para documentación
COMMENT ON TABLE product_ai_analysis IS 'Almacena análisis de IA para optimización de publicaciones de MercadoLibre';
COMMENT ON COLUMN product_ai_analysis.suggested_title IS 'Título optimizado sugerido por la IA';
COMMENT ON COLUMN product_ai_analysis.suggested_description IS 'Descripción optimizada sugerida por la IA';
COMMENT ON COLUMN product_ai_analysis.improvements_explanation IS 'Explicación de por qué las sugerencias son mejores';
COMMENT ON COLUMN product_ai_analysis.overall_score IS 'Score de optimización del 0 al 10';
COMMENT ON COLUMN product_ai_analysis.keyword_analysis IS 'Análisis detallado de cada keyword (relevancia, score, razón)';
COMMENT ON COLUMN product_ai_analysis.ai_provider IS 'Proveedor de IA usado: anthropic, openai, gemini, o basic';
