-- Tabla para cachear keywords por categoría
CREATE TABLE IF NOT EXISTS category_keywords_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id VARCHAR(255) NOT NULL,
  keywords JSONB NOT NULL, -- Array de {keyword, url, searches}
  source VARCHAR(50) NOT NULL, -- 'trends' o 'products'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id)
);

-- Índice para búsquedas rápidas por categoría
CREATE INDEX IF NOT EXISTS idx_category_keywords_cache_category_id ON category_keywords_cache(category_id);

-- Índice para búsquedas por fecha (para limpieza de cache viejo)
CREATE INDEX IF NOT EXISTS idx_category_keywords_cache_updated_at ON category_keywords_cache(updated_at);

-- Función para actualizar el timestamp
CREATE OR REPLACE FUNCTION update_category_keywords_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar automáticamente updated_at
CREATE TRIGGER trigger_update_category_keywords_cache_updated_at
  BEFORE UPDATE ON category_keywords_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_category_keywords_cache_updated_at();

-- Comentarios
COMMENT ON TABLE category_keywords_cache IS 'Cache de keywords trending por categoría de MercadoLibre (TTL: 2 días)';
COMMENT ON COLUMN category_keywords_cache.category_id IS 'ID de categoría de MercadoLibre';
COMMENT ON COLUMN category_keywords_cache.keywords IS 'Array JSON de keywords con sus metadatos';
COMMENT ON COLUMN category_keywords_cache.source IS 'Origen de las keywords: trends o products';
COMMENT ON COLUMN category_keywords_cache.updated_at IS 'Última actualización del cache (renovar cada 2 días)';
