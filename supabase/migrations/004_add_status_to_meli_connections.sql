-- Agregar campo status a meli_connections
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meli_connections'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.meli_connections
    ADD COLUMN status TEXT DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected'));

    -- Marcar todas las conexiones existentes como 'connected'
    UPDATE public.meli_connections SET status = 'connected';
  END IF;
END $$;

-- Comentario
COMMENT ON COLUMN public.meli_connections.status IS 'Estado de la conexión: connected (tokens válidos) o disconnected (invalidada pero mantiene datos históricos)';
