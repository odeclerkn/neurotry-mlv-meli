# Scripts SQL - MLP Optimizador MELI

Este directorio contiene todos los scripts SQL necesarios para crear las tablas en Supabase.

## 📋 Archivos disponibles

### Opción 1: Ejecutar todo de una vez (Recomendado)

**Archivo:** `00_SCHEMA_COMPLETE.sql`

Contiene TODAS las tablas del proyecto en un solo archivo:
- ✅ Perfiles de usuarios (Fase 1A)
- ✅ Conexiones MELI (Fase 1B)
- ✅ Productos (Fase 2 - Opcional por ahora)

**Cuándo usar:** Si quieres crear todas las tablas de una vez.

### Opción 2: Ejecutar paso a paso

**1. `01_SCHEMA_PROFILES.sql`** (OBLIGATORIO - Fase 1A)
- Tabla `profiles`
- Trigger para crear perfiles automáticamente
- Políticas RLS

**Cuándo usar:** Para la funcionalidad básica de autenticación de usuarios.

---

**2. `02_SCHEMA_MELI_CONNECTIONS.sql`** (OBLIGATORIO - Fase 1B)
- Tabla `meli_connections` (tokens, usuario MELI)
- Tabla `oauth_states` (protección CSRF)
- Políticas RLS
- Función de limpieza de estados expirados

**Cuándo usar:** Para conectar cuentas de MercadoLibre.

---

**3. `03_SCHEMA_PRODUCTS.sql`** (OPCIONAL - Fase 2)
- Tabla `products` (publicaciones sincronizadas)
- Funciones auxiliares para análisis
- Políticas RLS

**Cuándo usar:** Cuando implementes sincronización de productos (próxima fase).

## 🚀 Cómo ejecutar

### Método 1: Todo de una vez

1. Ve a tu dashboard de Supabase
2. Clic en **SQL Editor** (menú izquierdo)
3. Clic en **New query**
4. Abre el archivo `00_SCHEMA_COMPLETE.sql`
5. Copia TODO el contenido
6. Pégalo en el SQL Editor
7. Clic en **Run** (o Ctrl/Cmd + Enter)

### Método 2: Paso a paso

Ejecuta los archivos en orden:

1. **Primero:** `01_SCHEMA_PROFILES.sql`
2. **Segundo:** `02_SCHEMA_MELI_CONNECTIONS.sql`
3. **Tercero (Opcional):** `03_SCHEMA_PRODUCTS.sql`

Para cada archivo:
1. SQL Editor → New query
2. Copia el contenido del archivo
3. Pégalo y ejecuta
4. Verifica que no haya errores

## ✅ Verificación

Después de ejecutar los scripts, verifica en Supabase:

### 1. Table Editor
Deberías ver las siguientes tablas:

**Fase 1A:**
- `profiles`

**Fase 1B:**
- `meli_connections`
- `oauth_states`

**Fase 2 (Opcional):**
- `products`

### 2. Policies (RLS)
Cada tabla debe tener 4 políticas activas:
- SELECT (view own)
- INSERT (insert own)
- UPDATE (update own)
- DELETE (delete own)

### 3. Functions
Deberías ver estas funciones:

**Fase 1A:**
- `handle_new_user()` - Crea perfil automáticamente

**Fase 1B:**
- `cleanup_expired_oauth_states()` - Limpia estados OAuth expirados

**Fase 2 (Opcional):**
- `get_products_needing_analysis()` - Obtiene productos sin analizar
- `get_product_stats()` - Estadísticas de productos

### 4. Triggers
- `on_auth_user_created` - En la tabla `auth.users`

## 🔧 Troubleshooting

### Error: "relation already exists"
**Causa:** La tabla ya fue creada anteriormente.

**Solución:** Los scripts usan `CREATE TABLE IF NOT EXISTS` y `DROP POLICY IF EXISTS`, por lo que puedes ejecutarlos múltiples veces sin problemas.

### Error: "permission denied for schema public"
**Causa:** Problemas de permisos en Supabase.

**Solución:** Asegúrate de estar ejecutando desde SQL Editor en tu proyecto de Supabase con las credenciales correctas.

### Error: "foreign key constraint violation"
**Causa:** Intentaste ejecutar los scripts en el orden incorrecto.

**Solución:** Ejecuta en orden:
1. `01_SCHEMA_PROFILES.sql`
2. `02_SCHEMA_MELI_CONNECTIONS.sql`
3. `03_SCHEMA_PRODUCTS.sql`

O usa `00_SCHEMA_COMPLETE.sql` que tiene el orden correcto.

## 📊 Estructura de las tablas

### profiles
```
id (UUID, PK) → auth.users(id)
full_name (TEXT)
avatar_url (TEXT)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### meli_connections
```
id (UUID, PK)
user_id (UUID, FK) → auth.users(id)
meli_user_id (BIGINT)
meli_nickname (VARCHAR)
access_token_encrypted (TEXT) ← Encriptado
refresh_token_encrypted (TEXT) ← Encriptado
expires_at (TIMESTAMP)
connected_at (TIMESTAMP)
last_sync_at (TIMESTAMP)
is_active (BOOLEAN)
```

### oauth_states
```
state (VARCHAR, PK)
user_id (UUID, FK) → auth.users(id)
created_at (TIMESTAMP)
expires_at (TIMESTAMP)
```

### products (Opcional)
```
id (VARCHAR, PK) ← ID de MELI (MLM123...)
user_id (UUID, FK) → auth.users(id)
title (TEXT)
description (TEXT)
price (DECIMAL)
... (más campos)
raw_data (JSONB) ← Respuesta completa de MELI
```

## 🔒 Seguridad (RLS)

Todas las tablas tienen Row Level Security (RLS) habilitado:
- ✅ Cada usuario solo puede ver/modificar sus propios datos
- ✅ Políticas automáticas basadas en `auth.uid()`
- ✅ Protección contra acceso no autorizado

## 📝 Notas importantes

1. **Los tokens de MELI se guardan encriptados** con AES-256 en la columna `access_token_encrypted`
2. **Los estados OAuth expiran en 10 minutos** para protección CSRF
3. **La tabla products es opcional** - solo necesaria cuando implementes sincronización
4. **Puedes ejecutar los scripts múltiples veces** sin problemas (usan IF NOT EXISTS)

## 🎯 Para empezar rápido

**Lo mínimo necesario para probar la app:**
1. Ejecuta `01_SCHEMA_PROFILES.sql`
2. Ejecuta `02_SCHEMA_MELI_CONNECTIONS.sql`
3. ¡Listo! Ya puedes probar login y conexión con MELI

**Para funcionalidad completa:**
- Ejecuta `00_SCHEMA_COMPLETE.sql` (incluye todo)
