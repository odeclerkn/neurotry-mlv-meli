# Guía: Registro de Aplicación en MercadoLibre Developers

**Objetivo:** Obtener credenciales OAuth (Client ID y Client Secret) para tu aplicación.

**Tiempo estimado:** 10-15 minutos

**Prerequisito:** Cuenta de MercadoLibre (puede ser la misma de vendedor o crear una nueva)

---

## 📋 Paso a Paso

### 1. Acceder al Portal de Desarrolladores

1. Ir a: **https://developers.mercadolibre.com**
2. Click en **"Ingresar"** (esquina superior derecha)
3. Iniciar sesión con tu cuenta de MercadoLibre

```
💡 Tip: Puedes usar tu cuenta de vendedor o crear una cuenta
        específica para desarrollo.
```

---

### 2. Crear Nueva Aplicación

1. Una vez logueado, ir a **"Mis aplicaciones"** en el menú superior
2. Click en el botón **"Crear nueva aplicación"** o **"Create a new application"**

![Crear aplicación](https://via.placeholder.com/800x200/0066CC/FFFFFF?text=Crear+nueva+aplicación)

---

### 3. Completar Formulario de Registro

Llenar los siguientes campos:

#### 📝 Información Básica

| Campo | Valor para tu proyecto |
|-------|------------------------|
| **Nombre de la aplicación** | `MLP Optimizador MELI` o el nombre que prefieras |
| **Descripción corta** | `Optimizador de publicaciones para vendedores` |
| **Descripción larga** | `Herramienta que analiza publicaciones de MercadoLibre y genera sugerencias de optimización basadas en keywords trending para mejorar la visibilidad y ventas.` |

#### 🌐 URLs y Callback

| Campo | Valor (temporalmente con ngrok) |
|-------|--------------------------------|
| **URL del sitio web** | `https://tu-url.ngrok.io` (actualizar cuando tengas ngrok corriendo) |
| **Redirect URI** | `https://tu-url.ngrok.io/auth/callback` |

```
⚠️ IMPORTANTE sobre Redirect URI:
- Debe ser EXACTAMENTE igual a la que uses en tu código
- Incluir protocolo https://
- Incluir path /auth/callback
- SIN barra final
- Ejemplos correctos:
  ✅ https://abc123.ngrok.io/auth/callback
  ✅ https://tuapp.vercel.app/auth/callback
- Ejemplos incorrectos:
  ❌ http://abc123.ngrok.io/auth/callback  (http en lugar de https)
  ❌ https://abc123.ngrok.io/auth/callback/  (barra final)
  ❌ https://abc123.ngrok.io  (falta el path)
```

#### 📂 Categoría

Seleccionar: **"Otros"** o **"Herramientas para vendedores"**

#### 🔐 Permisos (Scopes)

Seleccionar los siguientes scopes:

- [x] **read** - Leer información de publicaciones, usuario, etc.
- [x] **offline_access** - Refresh token de larga duración (6 meses)

```
💡 NO seleccionar:
   [ ] write - NO lo necesitas para el MVP (solo análisis)

   Podrás agregar más scopes después si los necesitas.
```

---

### 4. Revisar y Crear

1. Revisar que toda la información esté correcta
2. Aceptar los **Términos y Condiciones** de MercadoLibre
3. Click en **"Crear aplicación"** o **"Create application"**

---

### 5. Obtener Credenciales

Una vez creada la aplicación, verás una pantalla con tus credenciales:

```
┌─────────────────────────────────────────────────┐
│  🎉 Aplicación creada exitosamente             │
├─────────────────────────────────────────────────┤
│                                                 │
│  Client ID:                                     │
│  ┌───────────────────────────────────────────┐ │
│  │ 1234567890123456                          │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Client Secret:                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ AbCdEfGh1234567890                        │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [Copiar Client ID]  [Copiar Client Secret]    │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 6. Copiar Credenciales a .env

```bash
# 1. Abrir tu archivo .env
nano .env
# o usar tu editor favorito

# 2. Pegar las credenciales
MELI_CLIENT_ID=1234567890123456
MELI_CLIENT_SECRET=AbCdEfGh1234567890

# 3. Guardar archivo
```

---

## 🔄 Actualizar Redirect URI cuando tengas ngrok

Cuando levantes ngrok por primera vez y obtengas tu URL pública:

### Opción A: Manualmente

1. Ir a https://developers.mercadolibre.com
2. **Mis aplicaciones** → Seleccionar tu app
3. **Configuración** o **Settings**
4. Buscar sección **"Redirect URIs"**
5. Agregar nueva URI: `https://nueva-url.ngrok.io/auth/callback`
6. Guardar cambios

### Opción B: Automáticamente (cuando tengas el backend)

```bash
# Script actualiza .env automáticamente
node scripts/update-ngrok-url.js

# Luego actualizar manualmente en MELI Developers
# (no se puede automatizar por seguridad)
```

---

## ✅ Verificación

Después de registrar tu app, verifica que tienes:

- [x] Client ID copiado
- [x] Client Secret copiado
- [x] Redirect URI configurado
- [x] Scopes `read` y `offline_access` seleccionados
- [x] Credenciales pegadas en `.env`

---

## 🔐 Seguridad de Credenciales

### ✅ HACER:
- ✅ Guardar Client Secret en `.env` (nunca en código)
- ✅ Agregar `.env` a `.gitignore` (ya está ✅)
- ✅ Usar variables de entorno en producción
- ✅ Rotar Client Secret si se compromete

### ❌ NUNCA:
- ❌ Subir Client Secret a Git
- ❌ Compartir Client Secret públicamente
- ❌ Usar Client Secret en frontend/JavaScript del navegador
- ❌ Hardcodear credenciales en el código

---

## 🧪 Probar OAuth (después de implementar)

Una vez que implementes el backend OAuth:

```bash
# 1. Levantar todo
docker-compose up -d
ngrok http 3000

# 2. Ir a tu app
http://localhost:3000

# 3. Click en "Conectar con MercadoLibre"

# 4. Deberías ver:
#    a) Redirección a mercadolibre.com
#    b) Pantalla de autorización de MELI
#    c) Click "Autorizar"
#    d) Redirección de vuelta a tu app
#    e) ✅ Usuario conectado
```

---

## ❓ Troubleshooting

### "redirect_uri_mismatch"

**Error:**
```json
{
  "error": "redirect_uri_mismatch",
  "message": "The redirect_uri MUST match..."
}
```

**Solución:**
1. Verificar que `REDIRECT_URI` en `.env` sea **exactamente** igual a la configurada en MELI
2. Verificar protocolo (https vs http)
3. Verificar path (/auth/callback)
4. Verificar que no haya espacios o caracteres extras

```bash
# Ver tu REDIRECT_URI actual
cat .env | grep REDIRECT_URI

# Comparar con MELI Developers
# Deben ser IDÉNTICAS
```

### "invalid_client"

**Error:**
```json
{
  "error": "invalid_client"
}
```

**Solución:**
- Verificar que `MELI_CLIENT_ID` y `MELI_CLIENT_SECRET` estén correctos
- Verificar que no haya espacios antes/después
- Copiar y pegar de nuevo desde MELI Developers

### "Application not found"

**Solución:**
- Verificar que la aplicación esté activa en MELI Developers
- Verificar que no esté en modo "borrador"

---

## 📚 Recursos Oficiales

- **Portal Developers:** https://developers.mercadolibre.com
- **Documentación OAuth:** https://developers.mercadolibre.com/es_ar/autenticacion-y-autorizacion
- **FAQs:** https://developers.mercadolibre.com/es_ar/guia-de-autorizacion

---

## 🎯 Próximos Pasos

Una vez que tengas las credenciales:

1. ✅ Credenciales en `.env`
2. ⏳ Levantar Docker: `docker-compose up -d`
3. ⏳ Generar clave de encriptación: `node scripts/generate-encryption-key.js`
4. ⏳ Levantar ngrok: `ngrok http 3000`
5. ⏳ Actualizar Redirect URI en MELI
6. ⏳ Comenzar implementación OAuth 2.0

Ver plan completo en: `documentacion/PLAN_HIBRIDO.md`

---

## 📸 Capturas de Referencia

### Pantalla de Mis Aplicaciones
```
┌────────────────────────────────────────────────────────┐
│  MercadoLibre Developers                               │
├────────────────────────────────────────────────────────┤
│  [Inicio] [Documentación] [Mis aplicaciones] [Salir]  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Mis Aplicaciones                                      │
│  ─────────────────                                     │
│                                                        │
│  [+ Crear nueva aplicación]                            │
│                                                        │
│  ┌──────────────────────────────────────────────┐     │
│  │ 📱 MLP Optimizador MELI                      │     │
│  │                                               │     │
│  │ ID: 1234567890123456                          │     │
│  │ Estado: ✅ Activa                            │     │
│  │                                               │     │
│  │ [Ver detalles] [Editar] [Configuración]      │     │
│  └──────────────────────────────────────────────┘     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Configuración de Redirect URIs
```
┌────────────────────────────────────────────────────────┐
│  Configuración → Redirect URIs                         │
├────────────────────────────────────────────────────────┤
│                                                        │
│  URLs de redirección permitidas:                       │
│  ───────────────────────────────                       │
│                                                        │
│  ┌────────────────────────────────────────────────┐   │
│  │ https://abc123.ngrok.io/auth/callback         │ ❌│
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  ┌────────────────────────────────────────────────┐   │
│  │ https://xyz789.ngrok.io/auth/callback         │ ✅│
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  [+ Agregar nueva URL]                                 │
│                                                        │
│  💡 Puedes tener múltiples URLs para desarrollo       │
│     y producción                                       │
│                                                        │
│  [Guardar cambios]                                     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

**Última actualización:** Enero 2026
**Referencia:** PLAN_HIBRIDO.md
