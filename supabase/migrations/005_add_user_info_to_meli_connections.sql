-- Agregar campos de información del usuario de MercadoLibre
DO $$
BEGIN
  -- Agregar meli_nickname si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meli_connections'
    AND column_name = 'meli_nickname'
  ) THEN
    ALTER TABLE public.meli_connections
    ADD COLUMN meli_nickname TEXT;
  END IF;

  -- Agregar meli_email si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meli_connections'
    AND column_name = 'meli_email'
  ) THEN
    ALTER TABLE public.meli_connections
    ADD COLUMN meli_email TEXT;
  END IF;

  -- Agregar meli_first_name si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meli_connections'
    AND column_name = 'meli_first_name'
  ) THEN
    ALTER TABLE public.meli_connections
    ADD COLUMN meli_first_name TEXT;
  END IF;

  -- Agregar meli_last_name si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meli_connections'
    AND column_name = 'meli_last_name'
  ) THEN
    ALTER TABLE public.meli_connections
    ADD COLUMN meli_last_name TEXT;
  END IF;
END $$;

-- Comentarios
COMMENT ON COLUMN public.meli_connections.meli_nickname IS 'Nickname del usuario en MercadoLibre';
COMMENT ON COLUMN public.meli_connections.meli_email IS 'Email del usuario en MercadoLibre';
COMMENT ON COLUMN public.meli_connections.meli_first_name IS 'Nombre del usuario en MercadoLibre';
COMMENT ON COLUMN public.meli_connections.meli_last_name IS 'Apellido del usuario en MercadoLibre';
