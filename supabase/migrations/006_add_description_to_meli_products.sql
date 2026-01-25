-- Agregar campo description a meli_products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meli_products'
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.meli_products
    ADD COLUMN description TEXT;
  END IF;
END $$;

-- Comentario
COMMENT ON COLUMN public.meli_products.description IS 'Descripción del producto/publicación';
