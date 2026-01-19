# Instrucciones: Conexión con MercadoLibre

## Resumen de funcionalidad implementada

✅ **Estado de conexión con MercadoLibre**
- El dashboard ahora muestra si el usuario está conectado a su cuenta de MELI
- Si NO está conectado: muestra un botón "Conectar con MercadoLibre"
- Si SÍ está conectado: muestra los detalles de la conexión (usuario, fecha, última sync)

## Paso 1: Ejecutar el nuevo schema SQL en Supabase

**IMPORTANTE:** Debes ejecutar el SQL antes de probar la funcionalidad.

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto "neurotry-meli"
3. SQL Editor (menú izquierdo) → New query
4. Abre el archivo: `documentacion/SCHEMA_MELI.sql`
5. Copia TODO el contenido y pégalo en el SQL Editor
6. Click "Run" (o Ctrl/Cmd + Enter)

### Qué crea este SQL:

- ✅ Tabla `meli_connections`: Guarda las conexiones de MELI (tokens encriptados, usuario MELI, etc.)
- ✅ Tabla `oauth_states`: Para protección CSRF durante el flujo OAuth
- ✅ Políticas RLS: Seguridad para que cada usuario vea solo sus datos

## Paso 2: Verificar variables de entorno

Asegúrate de que tu `.env.local` tenga estas variables:

```env
# MercadoLibre OAuth
MELI_CLIENT_ID=6231900994479284
MELI_CLIENT_SECRET=DzK0IfoUT2kWE6Ly1WAhBfEwW9tVSMZm
MELI_REDIRECT_URI=http://localhost:3000/api/meli/callback

# Encryption (para tokens MELI)
ENCRYPTION_KEY=830422486b15ad71c0e14561c9e06ff44ee2edb0b7285d50dce6a7eab828d517
```

## Paso 3: Configurar la app en MercadoLibre

1. Ve a https://developers.mercadolibre.com/apps
2. Edita tu aplicación
3. **Redirect URI:** Agrega `http://localhost:3000/api/meli/callback`
4. **Scopes:** Asegúrate de tener al menos `read` (lectura de publicaciones)
5. Guarda los cambios

## Paso 4: Probar la funcionalidad

### Reinicia el servidor

```bash
# Si está corriendo, detén con Ctrl+C
npm run dev
```

### Flujo de prueba

1. **Inicia sesión** en http://localhost:3000/login
2. **Ve al dashboard** - Deberías ver una tarjeta amarilla que dice "Cuenta de MercadoLibre no conectada"
3. **Click en "Conectar con MercadoLibre"**
   - Serás redirigido a MercadoLibre
   - Inicia sesión con tu cuenta de MELI
   - Autoriza la aplicación
4. **Regresarás al dashboard** - Ahora deberías ver una tarjeta verde que dice "Conectado a MercadoLibre" con tus datos

### Estados visuales

#### Estado: NO conectado
```
⚠️ Cuenta de MercadoLibre no conectada
- Explicación de qué sucede al conectar
- Botón amarillo: "🔗 Conectar con MercadoLibre"
```

#### Estado: Conectado
```
✅ Conectado a MercadoLibre
- Usuario MELI: @tunickname
- Conectado desde: 18 ene, 2026
- Última sincronización: Nunca
- Estado: Activo
```

## Paso 5: Verificar en Supabase

Después de conectar, verifica que se guardó la conexión:

1. Ve a Supabase Dashboard → Table Editor
2. Tabla `meli_connections`
3. Deberías ver un registro con:
   - `user_id`: Tu UUID de usuario
   - `meli_user_id`: Tu ID de MercadoLibre
   - `access_token_encrypted`: Token encriptado
   - `is_active`: true

## Seguridad implementada

✅ **Tokens encriptados**: Los access_token y refresh_token se guardan encriptados con AES-256
✅ **CSRF protection**: Estado aleatorio para validar el flujo OAuth
✅ **RLS policies**: Cada usuario solo puede ver sus propias conexiones
✅ **Expiración de states**: Los states OAuth expiran en 10 minutos

## Archivos creados/modificados

### Nuevos archivos:
- `lib/encryption.ts` - Encriptación/desencriptación de tokens
- `lib/meli/oauth.ts` - Helpers para OAuth de MELI
- `app/api/meli/connect/route.ts` - Endpoint para iniciar OAuth
- `app/api/meli/callback/route.ts` - Endpoint para recibir código de MELI
- `components/dashboard/MeliConnectionCard.tsx` - Componente visual del estado
- `documentacion/SCHEMA_MELI.sql` - Schema de las tablas de MELI

### Archivos modificados:
- `app/(dashboard)/dashboard/page.tsx` - Usa el nuevo componente

## Próximos pasos (no implementados aún)

- ⏳ Sincronización de productos desde MELI
- ⏳ Refresh automático de tokens expirados
- ⏳ Desconectar cuenta de MELI
- ⏳ Ver lista de productos sincronizados

## Troubleshooting

### Error: "relation meli_connections does not exist"
**Solución:** No ejecutaste el SQL en Supabase. Ve al Paso 1.

### Error: "redirect_uri mismatch"
**Solución:** La URL de callback no coincide. Verifica:
- `.env.local` tiene `MELI_REDIRECT_URI=http://localhost:3000/api/meli/callback`
- En MELI Developers, la app tiene esa misma URL configurada

### El botón de conectar no hace nada
**Solución:** Abre la consola del navegador (F12) y revisa errores. Probablemente:
- Falta ejecutar el SQL
- Variables de entorno incorrectas

### Me redirige al dashboard con "?error=connection_failed"
**Solución:** Revisa los logs del servidor. Probablemente:
- `MELI_CLIENT_ID` o `MELI_CLIENT_SECRET` incorrectos
- El código de autorización expiró (reinicia el flujo)

## ¿Listo para probar?

1. ✅ Ejecutar SQL en Supabase
2. ✅ Verificar `.env.local`
3. ✅ Configurar redirect URI en MELI Developers
4. ✅ Reiniciar servidor: `npm run dev`
5. ✅ Ir a http://localhost:3000/login
6. ✅ Login → Dashboard → Click "Conectar con MercadoLibre"
