# Pipeline de Optimización de Publicaciones - Documentación Completa

## Resumen Ejecutivo

Este documento explica el proceso completo de análisis y optimización de publicaciones de MercadoLibre, desde la sincronización inicial hasta la generación de sugerencias con Inteligencia Artificial.

---

## Flujo General del Sistema

```
1. Sincronización de Productos (MercadoLibre API)
   ↓
2. Obtención de Keywords Trending (MercadoLibre Trends API)
   ↓
3. Análisis de Competidores Exitosos (MercadoLibre Search API)
   ↓
4. Análisis con IA (Claude/GPT-4/Gemini)
   ↓
5. Persistencia en Base de Datos (Supabase PostgreSQL)
   ↓
6. Visualización y Exportación (Excel)
```

---

## Paso 1: Sincronización de Productos

### Objetivo
Traer todas las publicaciones activas del usuario desde MercadoLibre y guardarlas en nuestra base de datos.

### API Utilizada
**MercadoLibre Items API**
- Endpoint: `GET https://api.mercadolibre.com/users/{user_id}/items/search`
- Parámetros: `status=active`, `limit=50`, `offset={n}`
- Autenticación: Bearer token (OAuth2)

### Proceso Detallado

1. **Obtención del listado de IDs**
   - Se solicitan los IDs de todas las publicaciones activas del usuario
   - La API retorna resultados paginados (50 items por página)
   - Se itera hasta obtener todos los IDs

2. **Obtención de detalles de cada producto**
   - Por cada ID, se hace una petición a: `GET /items/{item_id}`
   - Se obtienen: título, descripción, precio, stock, imágenes, atributos, categoría

3. **Guardado en base de datos**
   - Tabla: `meli_products`
   - Se usa UPSERT para actualizar productos existentes
   - Se marcan productos nuevos con flag `is_new`
   - Se detectan cambios y se marca `is_updated`

### Código de Referencia
Archivo: `/app/api/meli/sync-products/route.ts`

```typescript
// 1. Obtener IDs de productos
const searchResponse = await fetch(
  `${MELI_API_URL}/users/${meliUserId}/items/search?status=active&limit=50&offset=${offset}`,
  { headers: { 'Authorization': `Bearer ${accessToken}` } }
)

// 2. Obtener detalles de cada producto
const detailsResponse = await fetch(
  `${MELI_API_URL}/items/${itemId}`,
  { headers: { 'Authorization': `Bearer ${accessToken}` } }
)

// 3. Guardar en base de datos
await supabase.from('meli_products').upsert({
  meli_product_id: itemId,
  connection_id: connectionId,
  title: item.title,
  description: item.description?.plain_text,
  price: item.price,
  // ... más campos
})
```

---

## Paso 2: Obtención de Keywords Trending

### Objetivo
Identificar qué términos de búsqueda están siendo más utilizados en la categoría del producto.

### API Utilizada
**MercadoLibre Trends API** (o Search API como alternativa)
- Endpoint: `GET https://api.mercadolibre.com/trends/{site_id}/{category_id}`
- Alternativa: Análisis de búsquedas populares en la categoría
- Sin autenticación (API pública)

### Proceso Detallado

1. **Identificación de categoría**
   - Se obtiene el `category_id` del producto (ej: "MLA1055" para celulares)

2. **Consulta de keywords trending**
   - Se solicitan los términos más buscados en esa categoría
   - Se filtran por relevancia y volumen de búsqueda

3. **Guardado temporal**
   - Los keywords se guardan en tabla `trending_keywords`
   - Se actualiza un timestamp para caché (evitar llamadas repetidas)

### Código de Referencia
Archivo: `/app/api/meli/trending-keywords/route.ts`

```typescript
// Consulta de keywords trending
const trendsResponse = await fetch(
  `${MELI_API_URL}/trends/MLA/${categoryId}`,
  { headers: { 'Accept': 'application/json' } }
)

// Guardado con caché de 24 horas
await supabase.from('trending_keywords').upsert({
  category_id: categoryId,
  keywords: trendsData,
  fetched_at: new Date()
})
```

---

## Paso 3: Análisis de Competidores Exitosos

### Objetivo
Encontrar publicaciones similares que han tenido éxito (muchas ventas) para identificar patrones ganadores.

### API Utilizada
**MercadoLibre Search API**
- Endpoint: `GET https://api.mercadolibre.com/sites/MLA/search`
- Parámetros de búsqueda:
  - `q`: Término de búsqueda (marca + modelo)
  - `category`: Categoría del producto
  - `sort`: `sold_quantity_desc` (ordenar por más vendidos)
  - `limit`: 30 resultados
- Sin autenticación (API pública)

### Proceso Detallado

1. **Construcción de búsqueda inteligente**
   - Se extraen atributos clave del producto: marca, modelo, características principales
   - Se construye query de búsqueda: "Samsung Galaxy A54 5G"

2. **Filtrado y ordenamiento**
   - Se busca en la misma categoría
   - Se ordena por cantidad vendida (descendente)
   - Se obtienen los top 10-30 competidores

3. **Análisis de patrones**
   - Se extraen keywords comunes de los títulos exitosos
   - Se identifican estructuras de descripción efectivas
   - Se detectan atributos que destacan los competidores

4. **Generación de insights**
   - Lista de keywords que usan los top sellers
   - Estructura de títulos más efectiva
   - Atributos faltantes en nuestra publicación

### Código de Referencia
Archivo: `/app/api/meli/similar-products/route.ts`

```typescript
// Construcción de búsqueda
const searchQuery = `${brand} ${model}`

// Búsqueda de competidores exitosos
const searchUrl = `${MELI_API_URL}/sites/MLA/search?` + new URLSearchParams({
  q: searchQuery,
  category: categoryId,
  limit: '30',
  sort: 'sold_quantity_desc',
  ...(brand && { 'BRAND': brand })
})

// Análisis de los top 10
const topProducts = results.slice(0, 10)
const commonKeywords = extractKeywords(topProducts.map(p => p.title))
```

---

## Paso 4: Análisis con Inteligencia Artificial

### Objetivo
Utilizar modelos de lenguaje avanzados para generar sugerencias específicas y relevantes de optimización.

### APIs Utilizadas (Multi-proveedor)

El sistema soporta 3 proveedores con selección automática:

#### Opción 1: Anthropic Claude (Prioridad 1)
- API: Claude API
- Modelo: `claude-3-5-sonnet-20241022`
- Endpoint: `https://api.anthropic.com/v1/messages`
- Ventajas: Excelente comprensión de contexto, respuestas estructuradas

#### Opción 2: OpenAI GPT-4 (Prioridad 2)
- API: OpenAI API
- Modelo: `gpt-4o`
- Endpoint: `https://api.openai.com/v1/chat/completions`
- Ventajas: JSON mode nativo, muy rápido

#### Opción 3: Google Gemini (Prioridad 3)
- API: Google Generative AI
- Modelo: `gemini-1.5-pro`
- Endpoint: Google Generative AI SDK
- Ventajas: Buen balance costo-calidad

### Proceso Detallado

1. **Detección automática de proveedor**
   ```typescript
   function getAIProvider(): 'anthropic' | 'openai' | 'gemini' | 'none' {
     if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
     if (process.env.OPENAI_API_KEY) return 'openai'
     if (process.env.GEMINI_API_KEY) return 'gemini'
     return 'none'
   }
   ```

2. **Construcción del prompt**

   El prompt incluye:
   - **Datos del producto**: título, descripción, precio, categoría, atributos
   - **Keywords trending**: lista de términos populares en la categoría
   - **Contexto de competidores**: patrones identificados (opcional)
   - **Instrucciones específicas**:
     - Validar relevancia de cada keyword
     - Generar descripción completa optimizada (no solo sugerencias)
     - Calcular score de optimización (0-10)
     - Proporcionar razones detalladas

3. **Validación semántica de keywords**

   La IA evalúa cada keyword con:
   - **Relevancia**: ¿Aplica a este producto específico?
   - **Score**: 0-10 basado en atributos del producto
   - **Razón**: Explicación de por qué es o no relevante
   - **Uso actual**: ¿Ya está en título/descripción?

4. **Generación de sugerencias**

   Output estructurado en JSON:
   ```json
   {
     "keywordAnalysis": [
       {
         "keyword": "5G",
         "isRelevant": true,
         "score": 9,
         "reason": "El producto tiene conectividad 5G según atributos",
         "inCurrentListing": false
       }
     ],
     "suggestions": {
       "optimizedTitle": "Samsung Galaxy A54 5G 128GB - Pantalla 120Hz - 50MP",
       "optimizedDescription": "DESCRIPCIÓN COMPLETA REESCRITA...",
       "descriptionImprovements": [
         "Agregado: información de conectividad 5G",
         "Mejorado: estructura de beneficios destacados"
       ],
       "missingAttributes": ["Peso", "Dimensiones"]
     },
     "overallScore": 7,
     "summary": "La publicación tiene buena base pero puede mejorar..."
   }
   ```

5. **Análisis de calidad**

   Score basado en:
   - Uso de keywords relevantes
   - Completitud de información
   - Claridad de descripción
   - Optimización SEO
   - Competitividad vs similares

### Código de Referencia
Archivo: `/app/api/meli/analyze-listing/route.ts`

```typescript
// Construcción del prompt
const prompt = `Analiza esta publicación de MercadoLibre y los keywords trending.

PRODUCTO:
Título: ${productData.title}
Descripción: ${productData.description?.plain_text}
Atributos: ${JSON.stringify(productData.attributes)}

KEYWORDS TRENDING:
${keywords.map(k => `- ${k.keyword}`).join('\n')}

TAREA:
1. Validar relevancia de cada keyword (score 0-10)
2. Generar descripción COMPLETA optimizada (no sugerencias)
3. Proponer título optimizado (máx 60 caracteres)
4. Calcular score global de optimización
...
`

// Llamada a la IA (ejemplo con Claude)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const message = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 2000,
  messages: [{ role: 'user', content: prompt }]
})

// Parseo de respuesta JSON
const analysis = JSON.parse(message.content[0].text)
```

### Fallback: Análisis Básico

Si no hay API key configurada, el sistema usa análisis básico:
- Validación por matching de strings
- Score predeterminado (5/10)
- Sugerencias genéricas

---

## Paso 5: Persistencia en Base de Datos

### Objetivo
Guardar los resultados del análisis para evitar re-procesamiento y permitir tracking histórico.

### Base de Datos Utilizada
**Supabase PostgreSQL**
- Tabla: `product_ai_analysis`
- Operación: UPSERT (INSERT ON CONFLICT UPDATE)
- Row Level Security (RLS) activado

### Esquema de Datos

```sql
CREATE TABLE product_ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES meli_products(id) ON DELETE CASCADE,
  suggested_title TEXT,
  suggested_description TEXT,
  improvements_explanation TEXT,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 10),
  summary TEXT,
  keyword_analysis JSONB DEFAULT '[]'::jsonb,
  suggestions JSONB DEFAULT '{}'::jsonb,
  ai_provider VARCHAR(50),
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id)
);
```

### Proceso de Guardado

1. **UPSERT Operation**
   - Si existe análisis previo → se actualiza
   - Si no existe → se crea nuevo registro
   - Se usa constraint `UNIQUE(product_id)` para detectar duplicados

2. **Datos guardados**
   ```typescript
   await supabase.from('product_ai_analysis').upsert({
     product_id: dbProduct.id,
     suggested_title: analysis.suggestions?.optimizedTitle,
     suggested_description: analysis.suggestions?.optimizedDescription,
     improvements_explanation: analysis.suggestions?.descriptionImprovements?.join('\n'),
     overall_score: analysis.overallScore,
     summary: analysis.summary,
     keyword_analysis: analysis.keywordAnalysis, // JSONB
     suggestions: analysis.suggestions, // JSONB
     ai_provider: provider, // 'anthropic', 'openai', 'gemini'
     analyzed_at: new Date().toISOString()
   }, {
     onConflict: 'product_id'
   })
   ```

3. **Tracking de cambios**
   - Timestamp `analyzed_at`: cuando se hizo el análisis
   - Campo `ai_provider`: qué IA se usó
   - Permite comparar análisis de diferentes proveedores

### Código de Referencia
Archivo: `/app/api/meli/analyze-listing/route.ts` (líneas 210-225)

---

## Paso 6: Visualización y Exportación

### Objetivo
Mostrar los resultados al usuario de forma clara y permitir exportación para análisis offline.

### Tecnologías Utilizadas

1. **Frontend: Next.js + React**
   - Server Components para data fetching
   - Client Components para interactividad
   - Tailwind CSS para estilos

2. **Exportación: ExcelJS**
   - Generación de archivos .xlsx
   - Múltiples hojas con diferentes niveles de detalle

### Visualización en Dashboard

**Tabla de productos** (`components/dashboard/products-table.tsx`)
- Columna "✨ Sugerencias IA": indica si hay análisis disponible
- Columna "🤖 Score": muestra score/10 con badge de color
- Click en fila → abre modal con detalles completos

**Modal de detalles** (`components/dashboard/product-detail-modal.tsx`)

Muestra:
1. **Keywords con indicadores de color**:
   - 🟢 Verde: Relevante y ya usado en la publicación
   - 🟡 Amarillo: Relevante pero NO usado (oportunidad)
   - 🔴 Rojo: No relevante para este producto

2. **Título sugerido**: comparación con el actual

3. **Descripción optimizada completa**: lista para copiar y pegar

4. **Explicación de mejoras**: qué cambios se hicieron y por qué

5. **Score global**: 0-10 con interpretación

6. **Metadatos**: proveedor de IA usado y fecha de análisis

### Exportación a Excel

**Estructura del archivo** (generado por `/app/api/meli/export-analysis/route.ts`):

#### Hoja 1: "Análisis de Publicaciones"
Columnas:
- ID Producto
- Título Original
- Título Sugerido por IA
- ¿Por qué cambiar el título?
- Descripción Original
- Descripción Optimizada por IA
- ¿Qué mejoras se hicieron?
- Score de Optimización (0-10)
- ¿Qué significa el score?
- Proveedor de IA
- Fecha de Análisis

#### Hoja 2: "Guía de Lectura"
Explicaciones para usuarios no técnicos:
- Qué es cada columna
- Cómo interpretar el score
- Qué significan los cambios sugeridos
- Cómo aplicar las mejoras

#### Hoja 3: "Datos Detallados - Keywords"
Análisis keyword por keyword:
- Producto ID
- Keyword
- ¿Es Relevante? (Sí/No)
- Score de Relevancia (0-10)
- Razón
- ¿Ya está en la publicación?

### Código de Referencia

**Generación de Excel:**
```typescript
import ExcelJS from 'exceljs'

const workbook = new ExcelJS.Workbook()
const mainSheet = workbook.addWorksheet('Análisis de Publicaciones')

// Configurar columnas
mainSheet.columns = [
  { header: 'Título Original', key: 'original_title', width: 50 },
  { header: 'Título Sugerido', key: 'suggested_title', width: 50 },
  // ...
]

// Agregar datos
products.forEach(product => {
  mainSheet.addRow({
    original_title: product.title,
    suggested_title: analysis.suggested_title,
    // ...
  })
})

// Generar buffer
const buffer = await workbook.xlsx.writeBuffer()
return new NextResponse(buffer, {
  headers: {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': 'attachment; filename="analisis.xlsx"'
  }
})
```

---

## Resumen de APIs por Etapa

| Etapa | API/Servicio | Endpoint | Autenticación |
|-------|--------------|----------|---------------|
| 1. Sync Productos | MercadoLibre Items API | `/users/{id}/items/search`<br>`/items/{id}` | OAuth Bearer Token |
| 2. Keywords Trending | MercadoLibre Trends API | `/trends/{site}/{category}` | Pública (no requiere) |
| 3. Competidores | MercadoLibre Search API | `/sites/{site}/search` | Pública (no requiere) |
| 4. Análisis IA | Anthropic Claude API | `/v1/messages` | API Key |
| 4. Análisis IA | OpenAI API | `/v1/chat/completions` | API Key |
| 4. Análisis IA | Google Gemini API | SDK `generateContent()` | API Key |
| 5. Persistencia | Supabase PostgreSQL | Queries SQL via REST | JWT Auth |
| 6. Exportación | ExcelJS (local) | N/A | N/A |

---

## Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USUARIO CONECTA CUENTA DE MERCADOLIBRE                      │
│    OAuth2 Flow → Access Token guardado en BD                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. SINCRONIZACIÓN DE PRODUCTOS                                  │
│    MercadoLibre API → Base de Datos (meli_products)           │
│    - IDs de productos activos                                   │
│    - Detalles completos de cada producto                       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. USUARIO HACE CLICK EN "ANALIZAR CON IA"                     │
│    Dispara análisis para un producto específico                │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. OBTENCIÓN DE CONTEXTO                                        │
│    ├─► MercadoLibre Trends API → Keywords trending             │
│    └─► MercadoLibre Search API → Competidores exitosos         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. ANÁLISIS CON INTELIGENCIA ARTIFICIAL                        │
│    Input: Producto + Keywords + Competidores                   │
│    Process: AI analiza y valida relevancia                     │
│    Output: Sugerencias + Score + Descripción optimizada        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. GUARDADO EN BASE DE DATOS                                    │
│    Tabla: product_ai_analysis                                  │
│    - Título sugerido                                            │
│    - Descripción optimizada                                     │
│    - Score y explicaciones                                      │
│    - Keywords analizados                                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. VISUALIZACIÓN AL USUARIO                                     │
│    ├─► Dashboard: Score visible en tabla                       │
│    ├─► Modal: Detalles completos con keywords coloreados       │
│    └─► Botón: Re-analizar si quiere actualizar                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. EXPORTACIÓN A EXCEL (Opcional)                               │
│    Todas las publicaciones con análisis → archivo .xlsx        │
│    - Hoja 1: Datos principales                                  │
│    - Hoja 2: Guía de lectura                                    │
│    - Hoja 3: Keywords detallados                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tiempo de Procesamiento Estimado

| Etapa | Tiempo Aproximado |
|-------|-------------------|
| Sync de 50 productos | 20-30 segundos |
| Obtención de keywords trending | 1-2 segundos |
| Análisis de competidores | 2-3 segundos |
| Análisis con IA (1 producto) | 3-8 segundos |
| Guardado en BD | < 1 segundo |
| Generación de Excel (100 productos) | 2-5 segundos |

**Total para análisis de 1 producto: ~10-15 segundos**

---

## Costos Estimados de APIs

### MercadoLibre API
- **Gratuita** (incluida en la plataforma)
- Rate limits: ~10,000 requests/hora

### APIs de IA (costos aproximados por análisis)

| Proveedor | Costo por análisis* | Modelo |
|-----------|---------------------|--------|
| Anthropic Claude | $0.003 - $0.006 | claude-3-5-sonnet |
| OpenAI GPT-4 | $0.004 - $0.008 | gpt-4o |
| Google Gemini | $0.002 - $0.004 | gemini-1.5-pro |

*Basado en prompts de ~1000 tokens input y ~1500 tokens output

### Supabase
- Plan gratuito: hasta 500MB BD y 2GB transferencia
- Plan Pro: $25/mes (suficiente para ~10,000 productos)

---

## Seguridad y Privacidad

1. **Tokens de MercadoLibre**
   - Almacenados encriptados en BD
   - Row Level Security (RLS) por usuario
   - Refresh automático antes de expiración

2. **Datos de productos**
   - Acceso restringido por usuario (RLS policies)
   - No se comparten entre cuentas
   - Históricos de análisis privados

3. **APIs de IA**
   - No se entrena con los datos enviados (políticas de OpenAI/Anthropic/Google)
   - Datos no persisten en servidores de IA
   - API keys en variables de entorno (nunca en código)

---

## Mantenimiento y Actualización

### Caché de Keywords Trending
- Actualización cada 24 horas
- Evita llamadas innecesarias a la API
- Se puede forzar refresh manual

### Re-análisis de Productos
- Los usuarios pueden re-analizar cuando quieran
- Útil cuando:
  - Cambian keywords trending de la categoría
  - Se actualiza el producto en MercadoLibre
  - Se quiere probar con otro proveedor de IA

### Migración de Base de Datos
- Scripts en `/supabase/migrations/`
- Versionados y documentados
- Rollback disponible si es necesario

---

## Troubleshooting Común

| Problema | Causa | Solución |
|----------|-------|----------|
| "No se puede sincronizar" | Token expirado | Reconectar cuenta MELI |
| "Error al analizar" | No hay API key configurada | Agregar API key en .env |
| Score bajo (2-3) | Falta información del producto | Completar descripción y atributos |
| Keywords irrelevantes | Categoría incorrecta | Verificar categoría en MELI |
| Excel vacío | No hay productos analizados | Analizar productos primero |

---

## Próximas Mejoras Planificadas

1. **Análisis batch**: analizar múltiples productos en paralelo
2. **Comparación histórica**: ver evolución del score en el tiempo
3. **A/B Testing**: medir impacto real de cambios sugeridos
4. **Auto-apply**: aplicar cambios automáticamente con aprobación
5. **Alertas**: notificar cuando hay nuevos keywords relevantes

---

## Contacto y Soporte

Para dudas técnicas o reportar problemas:
- Revisar este documento primero
- Consultar logs en consola del navegador (F12)
- Verificar variables de entorno (.env.local)
- Revisar estado de APIs de terceros

---

**Última actualización:** Enero 2025
**Versión del documento:** 1.0
