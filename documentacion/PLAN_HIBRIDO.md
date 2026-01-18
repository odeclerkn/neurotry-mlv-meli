# Plan Híbrido Sugerido: MVP → MLP sin Dominio

**Fecha:** Enero 2026
**Proyecto:** Optimizador de Publicaciones MercadoLibre
**Estrategia:** Desarrollo incremental MVP → MLP con mínima inversión inicial

---

## 🎯 Resumen Ejecutivo

Este plan permite desarrollar el proyecto en 2 etapas:

1. **MVP sin dominio** (3 semanas, $0) → Validación técnica
2. **Evolución a MLP** (2 semanas adicionales, $10/año) → Producto completo

**Inversión total:** $10-15/año
**Tiempo total:** 5 semanas con Claude Code (216h)

---

## ⚠️ Limitación Crítica: OAuth 2.0 y localhost

### Por qué NO puedes correr 100% local

MercadoLibre necesita redirigir al usuario después de autorizar OAuth. Para esto, tu app **DEBE** ser accesible desde internet con HTTPS.

```
❌ Flujo imposible:
Usuario → MELI autoriza → MELI intenta redirigir a http://localhost:3000
→ FALLA (MELI no puede alcanzar tu máquina local)

✅ Flujo correcto:
Usuario → MELI autoriza → MELI redirige a https://abc123.ngrok.io/auth/callback
→ ngrok tuneliza a tu localhost:3000 → FUNCIONA
```

**Conclusión:** Necesitas exposición pública con HTTPS, pero NO necesitas dominio propio.

---

## 📋 Fase 1: MVP sin Dominio

### Alcance del MVP

```
✅ OAuth 2.0 completo (con ngrok/Vercel)
✅ Gestión de tokens (Access + Refresh)
✅ Sincronización MANUAL (botón "Sincronizar")
✅ Análisis de keywords (reglas simples)
✅ Generación de Excel
✅ UI básica funcional
✅ Backend en Docker local
✅ PostgreSQL + Redis en Docker

❌ NO incluir Webhooks (necesitan URL estable)
❌ NO incluir WebSockets tiempo real
❌ NO incluir API REST externa
```

### Estimación MVP

| Métrica | Valor |
|---------|-------|
| **Tiempo (manual)** | 240h (6 semanas) |
| **Tiempo (Claude Code)** | 120h (3 semanas) |
| **Reducción** | 50% |
| **Costo infraestructura** | $0 |
| **Costo total** | $0 |

---

## 🐳 Setup Docker para MVP

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: mlp_postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: dev123
      POSTGRES_DB: mlp_meli
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: mlp_redis
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: mlp_backend
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      PORT: 3000
      DATABASE_URL: postgresql://postgres:dev123@postgres:5432/mlp_meli
      REDIS_URL: redis://redis:6379

      # OAuth MELI (actualizar con tu ngrok URL)
      MELI_CLIENT_ID: ${MELI_CLIENT_ID}
      MELI_CLIENT_SECRET: ${MELI_CLIENT_SECRET}
      REDIRECT_URI: https://abc123.ngrok.io/auth/callback

      # Encriptación
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}

    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./src:/app/src
      - ./node_modules:/app/node_modules
    command: npm run dev

volumes:
  pgdata:
  redisdata:
```

### .env.example

```bash
# MercadoLibre OAuth
MELI_CLIENT_ID=tu_client_id_aqui
MELI_CLIENT_SECRET=tu_client_secret_aqui
REDIRECT_URI=https://abc123.ngrok.io/auth/callback

# Encriptación (generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=tu_clave_de_32_bytes_en_hexadecimal

# Base de datos (ya configurada en docker-compose)
DATABASE_URL=postgresql://postgres:dev123@localhost:5432/mlp_meli
REDIS_URL=redis://localhost:6379

# Desarrollo
NODE_ENV=development
PORT=3000
```

---

## 🚀 Opciones de Exposición Pública

### Opción A: ngrok (Recomendada para desarrollo)

**Ventajas:**
- ✅ Gratis para desarrollo
- ✅ HTTPS automático y válido
- ✅ Setup en 2 minutos
- ✅ OAuth funciona perfectamente

**Desventajas:**
- ⚠️ URL cambia cada vez que reinicias (versión gratis)
- ⚠️ Debes actualizar en MELI Developers cada reinicio
- ❌ No apto para producción

**Setup:**

```bash
# 1. Instalar ngrok
npm install -g ngrok
# O descargar desde: https://ngrok.com/download

# 2. Registrarte en ngrok.com y obtener authtoken
ngrok config add-authtoken TU_TOKEN_AQUI

# 3. Levantar Docker
docker-compose up -d

# 4. Exponer puerto 3000
ngrok http 3000

# 5. Copiar URL (ej: https://abc123.ngrok.io)
# 6. Actualizar REDIRECT_URI en .env
# 7. Actualizar en MELI Developers → Configuración de App
```

**Comando rápido:**
```bash
# Terminal 1: Docker
docker-compose up

# Terminal 2: ngrok
ngrok http 3000
```

### Opción B: Vercel (Recomendada para MVP)

**Ventajas:**
- ✅ Gratis
- ✅ URL permanente: `tuapp.vercel.app`
- ✅ HTTPS automático
- ✅ Deploy automático desde Git
- ✅ Apto para MVP en producción

**Desventajas:**
- ⚠️ No incluye PostgreSQL/Redis (usar servicios externos)

**Setup:**

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Configurar variables de entorno en Vercel Dashboard
# MELI_CLIENT_ID, MELI_CLIENT_SECRET, DATABASE_URL, etc.

# 5. URL permanente: https://mlp-meli.vercel.app
```

**Servicios externos para Vercel:**
- PostgreSQL: [Supabase](https://supabase.com) (gratis hasta 500MB)
- Redis: [Upstash](https://upstash.com) (gratis hasta 10K requests/día)

### Opción C: Railway

**Ventajas:**
- ✅ $5/mes de crédito gratis
- ✅ PostgreSQL + Redis incluidos
- ✅ URL permanente: `tuapp.up.railway.app`
- ✅ Deploy desde Git
- ✅ Ideal para MVP

**Setup:**

```bash
# 1. Registrarse en railway.app

# 2. Instalar CLI
npm install -g @railway/cli

# 3. Login
railway login

# 4. Crear proyecto
railway init

# 5. Agregar PostgreSQL
railway add postgresql

# 6. Agregar Redis
railway add redis

# 7. Deploy
railway up
```

---

## 📊 Comparativa de Opciones

| Opción | OAuth | Costo | URL Permanente | DB Incluida | Webhooks | Producción |
|--------|-------|-------|----------------|-------------|----------|------------|
| **Docker + ngrok** | ✅ | $0 | ❌ Cambia | ✅ Local | ⚠️ Inestable | ❌ |
| **Vercel gratis** | ✅ | $0 | ✅ | ❌ | ✅ | ⚠️ MVP ok |
| **Railway** | ✅ | $5/mes | ✅ | ✅ | ✅ | ✅ |
| **Dominio + Vercel** | ✅ | $10/año | ✅ | ❌ | ✅ | ✅ |

---

## 🔄 Workflow de Desarrollo MVP

### Día a día con ngrok

```bash
# 1. Levantar infraestructura
docker-compose up -d

# 2. Exponer con ngrok (obtener nueva URL)
ngrok http 3000
# Ejemplo: https://xyz789.ngrok.io

# 3. Actualizar .env
REDIRECT_URI=https://xyz789.ngrok.io/auth/callback

# 4. Actualizar en MELI Developers
# https://developers.mercadolibre.com
# Configuración → Redirect URIs → Agregar nueva URL

# 5. Reiniciar backend (para cargar nueva URL)
docker-compose restart backend

# 6. Desarrollar
npm run dev

# 7. Probar OAuth
# http://localhost:3000 → Click "Conectar con MELI" → Funciona ✅
```

### Automatización (opcional)

```javascript
// scripts/update-ngrok-url.js
const fs = require('fs');
const axios = require('axios');

async function updateNgrokUrl() {
  // Obtener URL de ngrok API
  const response = await axios.get('http://localhost:4040/api/tunnels');
  const publicUrl = response.data.tunnels[0].public_url;

  console.log(`Nueva URL de ngrok: ${publicUrl}`);

  // Actualizar .env
  const envContent = fs.readFileSync('.env', 'utf8');
  const updatedEnv = envContent.replace(
    /REDIRECT_URI=.*/,
    `REDIRECT_URI=${publicUrl}/auth/callback`
  );
  fs.writeFileSync('.env', updatedEnv);

  console.log('✅ .env actualizado');
  console.log('⚠️  Recuerda actualizar en MELI Developers:');
  console.log(`   ${publicUrl}/auth/callback`);
}

updateNgrokUrl();
```

---

## 📋 Fase 2: Evolución a MLP

### Cuándo evolucionar

Evoluciona cuando:
- ✅ MVP validado y funcionando
- ✅ Usuarios probando el producto
- ✅ Listo para lanzar al mercado

### Qué agregar

```diff
MVP
✅ OAuth 2.0
✅ Tokens
✅ Sincronización manual
✅ Análisis básico
✅ Excel

+ MLP (agregar)
+ ✅ Webhooks en tiempo real
+ ✅ WebSockets (UI actualizada sin refresh)
+ ✅ API REST con API Keys
+ ✅ Análisis avanzado con LLM
+ ✅ UX pulida
+ ✅ Monitoring y alertas
```

### Pasos de evolución

```bash
# 1. Comprar dominio ($10-15/año)
# Proveedores: Namecheap, GoDaddy, Google Domains
# Ejemplo: optimizador-meli.com

# 2. Configurar DNS
# Apuntar dominio a Vercel/Railway

# 3. Configurar HTTPS
# Automático en Vercel/Railway

# 4. Actualizar MELI Developers
# Redirect URI: https://optimizador-meli.com/auth/callback
# Webhook URL: https://optimizador-meli.com/webhooks/meli

# 5. Implementar Webhooks (Fase 3 del plan)
# 6. Implementar WebSockets (Fase 4 del plan)
# 7. Implementar API REST (Fase 4 del plan)
```

### Estimación MLP (adicional)

| Métrica | Valor |
|---------|-------|
| **Tiempo adicional (manual)** | 184h (4.6 semanas) |
| **Tiempo adicional (Claude Code)** | 96h (2.4 semanas) |
| **Costo infraestructura** | $10-15/año (dominio) |
| **Costo total proyecto** | $10-15/año |

---

## 💰 Análisis de Costos Completo

### MVP (Fase 1)

| Concepto | Opción A (ngrok) | Opción B (Vercel) | Opción C (Railway) |
|----------|------------------|-------------------|-------------------|
| **Hosting** | $0 | $0 | $5/mes* |
| **Base de datos** | $0 (local) | $8/mes (Supabase) | Incluido |
| **Redis** | $0 (local) | $0 (Upstash free) | Incluido |
| **Dominio** | $0 | $0 | $0 |
| **TOTAL MES** | **$0** | **$8** | **$0*** |

*Railway incluye $5/mes de crédito gratis

### MLP (Fase 2)

| Concepto | Costo |
|----------|-------|
| **Dominio** | $10-15/año |
| **Hosting** | $0-5/mes |
| **Base de datos** | $0-8/mes |
| **TOTAL AÑO 1** | **$10-111** |

---

## 🗓️ Timeline Completo

### Con Claude Code (Recomendado)

```
Semana 1-3: MVP sin dominio
├─ Semana 1: Setup + OAuth (48h)
├─ Semana 2: Sincronización + Análisis (48h)
└─ Semana 3: UI + Excel + Deploy (24h)
   → Entregable: MVP funcionando en Vercel/Railway
   → Costo acumulado: $0-8/mes

[Pausa para validación - duración variable]

Semana 4-5: Evolución a MLP
├─ Semana 4: Webhooks + WebSockets (48h)
└─ Semana 5: API REST + UX + Testing (48h)
   → Entregable: MLP completo en producción
   → Costo adicional: $10/año (dominio)

TOTAL: 5 semanas (216h) | $10-20/año
```

### Sin Claude Code (Manual)

```
Semana 1-6: MVP sin dominio
└─ 240h de desarrollo
   → Entregable: MVP funcionando
   → Costo: $0-8/mes

Semana 7-11: Evolución a MLP
└─ 184h adicionales
   → Entregable: MLP completo
   → Costo adicional: $10/año

TOTAL: 11 semanas (424h) | $10-20/año
```

**Ahorro con Claude Code:** 6 semanas (208 horas)

---

## 📝 Checklist de Implementación

### Fase MVP

#### Setup Inicial
- [ ] Crear repositorio Git
- [ ] Configurar docker-compose.yml
- [ ] Crear .env desde .env.example
- [ ] Generar ENCRYPTION_KEY
- [ ] Registrar app en MELI Developers
- [ ] Obtener CLIENT_ID y CLIENT_SECRET
- [ ] Elegir opción de exposición (ngrok/Vercel/Railway)

#### Desarrollo
- [ ] Implementar OAuth 2.0 (8 pasos)
- [ ] Validación CSRF con state parameter
- [ ] Encriptación de tokens (AES-256)
- [ ] Almacenamiento en PostgreSQL
- [ ] Refresh automático de tokens
- [ ] Endpoint GET /users/:user_id/items
- [ ] Endpoint GET /trends/:category_id
- [ ] Análisis de keywords (reglas simples)
- [ ] Generación de Excel
- [ ] UI básica con botón "Sincronizar"

#### Testing
- [ ] Probar flujo OAuth completo
- [ ] Probar refresh de tokens
- [ ] Probar sincronización manual
- [ ] Probar generación de Excel
- [ ] Probar con 10, 50, 100 publicaciones

#### Deploy MVP
- [ ] Deploy a Vercel/Railway
- [ ] Configurar variables de entorno
- [ ] Actualizar REDIRECT_URI en MELI
- [ ] Probar en producción
- [ ] Compartir con usuarios beta

### Fase MLP (cuando tengas dominio)

#### Preparación
- [ ] Comprar dominio
- [ ] Configurar DNS
- [ ] Verificar HTTPS activo
- [ ] Actualizar URLs en MELI

#### Desarrollo Adicional
- [ ] Implementar endpoint POST /webhooks/meli
- [ ] Configurar workers asíncronos (Bull + Redis)
- [ ] Implementar WebSockets
- [ ] Actualización UI en tiempo real
- [ ] API REST con autenticación
- [ ] Sistema de API Keys
- [ ] Rate limiting
- [ ] Documentación API (Swagger)

#### Testing MLP
- [ ] Probar webhooks con cambios reales en MELI
- [ ] Probar WebSockets (multi-usuario)
- [ ] Probar API con Postman
- [ ] Tests de carga (100+ usuarios)
- [ ] Tests E2E completos

#### Deploy Producción
- [ ] CI/CD configurado
- [ ] Monitoring (Sentry/DataDog)
- [ ] Alertas configuradas
- [ ] Backups automáticos
- [ ] Documentación de usuario

---

## 🎓 Comandos Útiles

### Docker

```bash
# Levantar todo
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Reiniciar servicio
docker-compose restart backend

# Parar todo
docker-compose down

# Parar y borrar volúmenes (⚠️ borra DB)
docker-compose down -v

# Entrar a PostgreSQL
docker exec -it mlp_postgres psql -U postgres -d mlp_meli

# Entrar a Redis
docker exec -it mlp_redis redis-cli
```

### Base de datos

```sql
-- Ver usuarios conectados
SELECT * FROM users;

-- Ver tokens (encriptados)
SELECT user_id, meli_user_id, expires_at FROM user_tokens;

-- Borrar todos los datos (⚠️ cuidado)
TRUNCATE users, user_tokens CASCADE;
```

### ngrok

```bash
# Exponer puerto 3000
ngrok http 3000

# Con dominio custom (cuenta paga)
ngrok http 3000 --domain=tu-dominio.ngrok.io

# Ver dashboard
# http://localhost:4040
```

---

## 🔍 Troubleshooting

### OAuth no funciona

```bash
# 1. Verificar que ngrok esté corriendo
curl https://tu-url.ngrok.io/health
# Debe responder 200

# 2. Verificar REDIRECT_URI en .env
cat .env | grep REDIRECT_URI
# Debe coincidir con URL de ngrok

# 3. Verificar en MELI Developers
# https://developers.mercadolibre.com
# Redirect URIs → debe incluir tu URL de ngrok/Vercel

# 4. Verificar logs del backend
docker-compose logs -f backend
```

### Tokens expiran constantemente

```javascript
// Verificar lógica de refresh en tu código
const tokenExpiresAt = user.meli_token_expires_at;
const now = Date.now();
const thirtyMinutes = 30 * 60 * 1000;

if (tokenExpiresAt - now < thirtyMinutes) {
  console.log('⚠️  Token expira pronto, renovando...');
  await refreshAccessToken(user);
}
```

### ngrok URL cambia todo el tiempo

**Soluciones:**

1. **ngrok Pro ($8/mes):** URL estática permanente
2. **Usar Vercel gratis:** URL permanente sin costo
3. **Script de actualización automática:** (ver sección de automatización)

### PostgreSQL no conecta

```bash
# Verificar que el contenedor esté corriendo
docker ps | grep postgres

# Ver logs de PostgreSQL
docker-compose logs postgres

# Probar conexión manual
docker exec -it mlp_postgres psql -U postgres -d mlp_meli

# Si falla, recrear volumen
docker-compose down -v
docker-compose up -d
```

---

## 📚 Recursos Adicionales

### Documentación Oficial

- [MercadoLibre Developers](https://developers.mercadolibre.com)
- [OAuth 2.0 MELI](https://developers.mercadolibre.com/es_ar/autenticacion-y-autorizacion)
- [Webhooks MELI](https://developers.mercadolibre.com/es_ar/webhooks)
- [ngrok Documentation](https://ngrok.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)

### Herramientas Útiles

- [Postman](https://www.postman.com) - Testing de APIs
- [DBeaver](https://dbeaver.io) - Cliente PostgreSQL
- [RedisInsight](https://redis.com/redis-enterprise/redis-insight/) - Cliente Redis
- [ngrok Dashboard](http://localhost:4040) - Inspeccionar requests

---

## ✅ Próximos Pasos

1. **Ahora:**
   ```bash
   # Clonar/crear proyecto
   mkdir mlp-optimizador-meli
   cd mlp-optimizador-meli

   # Copiar docker-compose.yml de este documento
   # Crear .env desde .env.example

   # Levantar infraestructura
   docker-compose up -d
   ```

2. **Registrar en MELI:**
   - Ir a https://developers.mercadolibre.com
   - Crear aplicación
   - Guardar CLIENT_ID y CLIENT_SECRET

3. **Elegir exposición:**
   - Para desarrollo rápido: ngrok
   - Para MVP permanente: Vercel/Railway

4. **Comenzar Fase 1 (OAuth):**
   - Seguir sección "1. Proceso de Autenticación OAuth 2.0" del documento principal
   - Implementar 8 pasos del flujo OAuth

---

## 📞 Soporte

Si encuentras problemas durante la implementación:

1. Revisa la sección de Troubleshooting
2. Consulta los logs: `docker-compose logs -f`
3. Verifica las URLs en MELI Developers
4. Consulta documentación oficial de MELI

---

**Documento creado:** Enero 2026
**Versión:** 1.0
**Basado en:** "MLP Optimizador MELI - Arquitectura Técnica Completa v5.pdf"
