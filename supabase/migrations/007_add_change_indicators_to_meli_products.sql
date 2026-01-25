-- Agregar campos para indicadores de cambios en productos
DO $$
BEGIN
  -- Agregar is_new si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meli_products'
    AND column_name = 'is_new'
  ) THEN
    ALTER TABLE public.meli_products
    ADD COLUMN is_new BOOLEAN DEFAULT FALSE;
  END IF;

  -- Agregar is_updated si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meli_products'
    AND column_name = 'is_updated'
  ) THEN
    ALTER TABLE public.meli_products
    ADD COLUMN is_updated BOOLEAN DEFAULT FALSE;
  END IF;

  -- Agregar last_sync_at si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meli_products'
    AND column_name = 'last_sync_at'
  ) THEN
    ALTER TABLE public.meli_products
    ADD COLUMN last_sync_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Comentarios
COMMENT ON COLUMN public.meli_products.is_new IS 'Indica si el producto es nuevo (agregado en la última sincronización)';
COMMENT ON COLUMN public.meli_products.is_updated IS 'Indica si el producto fue actualizado en la última sincronización';
COMMENT ON COLUMN public.meli_products.last_sync_at IS 'Timestamp de la última sincronización del producto';
