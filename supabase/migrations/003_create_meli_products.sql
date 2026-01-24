-- Crear tabla meli_products para almacenar productos de MercadoLibre
CREATE TABLE IF NOT EXISTS public.meli_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.meli_connections(id) ON DELETE CASCADE,
  meli_product_id TEXT NOT NULL,
  title TEXT NOT NULL,
  price NUMERIC,
  available_quantity INTEGER,
  sold_quantity INTEGER,
  status TEXT,
  permalink TEXT,
  thumbnail TEXT,
  category_id TEXT,
  listing_type_id TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(connection_id, meli_product_id)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_meli_products_connection_id ON public.meli_products(connection_id);
CREATE INDEX IF NOT EXISTS idx_meli_products_meli_product_id ON public.meli_products(meli_product_id);
CREATE INDEX IF NOT EXISTS idx_meli_products_created_at ON public.meli_products(created_at DESC);

-- Habilitar Row Level Security
ALTER TABLE public.meli_products ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver sus propios productos
CREATE POLICY "Users can view their own products"
  ON public.meli_products
  FOR SELECT
  USING (
    connection_id IN (
      SELECT id FROM public.meli_connections
      WHERE user_id = auth.uid()
    )
  );

-- Política para que los usuarios solo puedan insertar productos en sus propias conexiones
CREATE POLICY "Users can insert products for their own connections"
  ON public.meli_products
  FOR INSERT
  WITH CHECK (
    connection_id IN (
      SELECT id FROM public.meli_connections
      WHERE user_id = auth.uid()
    )
  );

-- Política para que los usuarios solo puedan actualizar sus propios productos
CREATE POLICY "Users can update their own products"
  ON public.meli_products
  FOR UPDATE
  USING (
    connection_id IN (
      SELECT id FROM public.meli_connections
      WHERE user_id = auth.uid()
    )
  );

-- Política para que los usuarios solo puedan eliminar sus propios productos
CREATE POLICY "Users can delete their own products"
  ON public.meli_products
  FOR DELETE
  USING (
    connection_id IN (
      SELECT id FROM public.meli_connections
      WHERE user_id = auth.uid()
    )
  );

-- Comentarios para documentación
COMMENT ON TABLE public.meli_products IS 'Almacena productos sincronizados de MercadoLibre';
COMMENT ON COLUMN public.meli_products.connection_id IS 'ID de la conexión de MercadoLibre';
COMMENT ON COLUMN public.meli_products.meli_product_id IS 'ID del producto en MercadoLibre';
COMMENT ON COLUMN public.meli_products.raw_data IS 'Datos completos del producto en formato JSON';
