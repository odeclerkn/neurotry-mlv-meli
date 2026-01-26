# Guía de Usuario: Optimizador de Publicaciones MercadoLibre

**Versión:** 1.0
**Fecha:** Enero 2026

---

## 📖 Introducción

Esta herramienta te ayuda a optimizar tus publicaciones de MercadoLibre mediante análisis de IA que generan sugerencias basadas en keywords trending y mejores prácticas de e-commerce.

---

## 🚀 Primeros Pasos

### 1. Registro en la Aplicación

1. Ingresa a la aplicación
2. Crea tu cuenta con email y contraseña, o usa Google Sign-In
3. Confirma tu email (si es necesario)
4. Inicia sesión en la aplicación

### 2. Conectar tu Cuenta de MercadoLibre

1. Una vez dentro, haz clic en **"Conectar con MercadoLibre"**
2. Serás redirigido a MercadoLibre para autorizar la conexión
3. Inicia sesión con tu cuenta de vendedor de MercadoLibre
4. Autoriza los permisos solicitados (solo lectura)
5. Serás redirigido de vuelta a la aplicación

### 3. Sincronización Inicial

- La aplicación sincronizará automáticamente todas tus publicaciones activas
- Este proceso puede tomar unos minutos dependiendo de la cantidad de productos
- Verás una barra de progreso durante la sincronización

---

## 📊 Dashboard de Productos

### Vista de Tabla

Tu dashboard muestra todos tus productos con la siguiente información:

| Columna | Descripción |
|---------|-------------|
| **Imagen** | Miniatura del producto con indicadores NEW/UPD si es reciente o actualizado |
| **Título** | Nombre actual del producto en MercadoLibre |
| **Descripción** | Vista previa de la descripción (primeras líneas) |
| **Análisis IA** | Indica si el producto tiene análisis realizado ("Tiene" o "No tiene") |
| **Precio** | Precio actual de venta |
| **Stock** | Cantidad disponible |
| **Vendidos** | Cantidad de unidades vendidas |
| **Estado** | Estado de la publicación (activa, pausada, etc.) |
| **Score** | Puntuación de optimización de 0-10 (solo si tiene análisis) |

### Filtros y Búsqueda

- Usa la barra de búsqueda para filtrar por título
- Ordena por columna haciendo clic en los encabezados
- Filtra por estado de análisis (con/sin análisis)

---

## 🤖 Sistema de Análisis IA

### ¿Qué es el Análisis IA?

El análisis IA evalúa tu publicación y genera sugerencias automáticas para mejorar:

- **Título optimizado**: Incorpora keywords trending y mejores prácticas
- **Descripción mejorada**: Más completa, atractiva y optimizada para SEO
- **Análisis de keywords**: Identifica términos populares en tu categoría
- **Score general**: Puntuación de 0-10 que indica la calidad de tu publicación

### Proveedores de IA Disponibles

La aplicación utiliza el proveedor que tengas configurado (el administrador configura las API keys):

- **Claude (Anthropic)**: Análisis detallados y naturales
- **GPT-4 (OpenAI)**: Sugerencias precisas y creativas
- **Gemini (Google)**: Análisis equilibrados

---

## 🔄 Proceso de Re-Análisis Evolutivo

### ¿Qué es el Re-Análisis Evolutivo?

El sistema de re-análisis es **inteligente y evolutivo**. Esto significa que cada vez que vuelves a analizar un producto, la IA:

1. **Toma como base** las sugerencias previas (no el original de MELI)
2. **Evoluciona** esas sugerencias para hacerlas aún mejores
3. **Busca nuevas oportunidades** de mejora basándose en lo ya optimizado
4. **No parte de cero** - construye sobre el trabajo anterior

### Ejemplo de Evolución

**Análisis 1 (Partiendo del original):**
```
Original MELI: "Zapatillas Nike"
Sugerencia: "Zapatillas Nike Running Air Max - Hombre y Mujer"
Score: 6/10
```

**Re-Análisis 2 (Evolucionando la sugerencia):**
```
Base: "Zapatillas Nike Running Air Max - Hombre y Mujer"
Nueva sugerencia: "Zapatillas Nike Running Air Max 2024 - Deportivas Unisex - Envío Gratis"
Score: 8/10
```

**Re-Análisis 3 (Mejora continua):**
```
Base: "Zapatillas Nike Running Air Max 2024 - Deportivas Unisex - Envío Gratis"
Nueva sugerencia: "Zapatillas Nike Air Max 2024 Running Deportivas Unisex Original - Envío Gratis CABA"
Score: 9/10
```

### Cómo Realizar un Re-Análisis

1. Haz clic en un producto con análisis existente
2. En el modal de detalle, haz clic en **"Re-analizar producto"**
3. Espera mientras la IA procesa (puede tomar 10-30 segundos)
4. Revisa las nuevas sugerencias evolucionadas
5. Compara con el análisis anterior en el histórico

### Cuándo Hacer un Re-Análisis

Se recomienda re-analizar cuando:

- ✅ Ya implementaste las sugerencias anteriores en MELI
- ✅ Quieres seguir mejorando un producto importante
- ✅ Cambiaron las tendencias de tu categoría
- ✅ El score actual es bajo y quieres mejorarlo
- ✅ Han pasado varias semanas desde el último análisis

**Nota:** No es necesario re-analizar constantemente. Espera a implementar las sugerencias previas y ver resultados antes de pedir nuevas mejoras.

---

## 📜 Histórico de Análisis

### ¿Para Qué Sirve el Histórico?

Cada producto mantiene un **registro completo** de todos los análisis realizados, incluyendo:

- Fecha y hora de cada análisis
- Proveedor de IA utilizado (Claude, GPT-4, Gemini)
- Score obtenido
- Sugerencias de título
- Sugerencias de descripción
- Explicación de mejoras

### Ver el Histórico

1. Abre el detalle de un producto
2. Busca la sección **"📜 Histórico de Análisis"**
3. Haz clic en **"Ver histórico"** para expandir
4. Verás todos los análisis ordenados del más reciente al más antiguo

### Comparar Análisis

El histórico te permite:

- Ver cómo evolucionaron las sugerencias en el tiempo
- Comparar scores entre diferentes análisis
- Identificar qué proveedor de IA da mejores resultados para tu caso
- Recuperar sugerencias anteriores si las necesitas

---

## ♻️ Restaurar Análisis Anteriores

### ¿Cuándo Restaurar?

Puedes querer restaurar un análisis anterior si:

- Las sugerencias nuevas no te convencieron
- Prefieres una versión anterior del análisis
- Borraste accidentalmente el análisis actual
- Quieres volver a un punto anterior en la evolución

### Cómo Restaurar

1. Abre el detalle del producto
2. Ve al **"Histórico de Análisis"**
3. Encuentra el análisis que quieres restaurar
4. Haz clic en **"♻️ Restaurar como actual"**
5. Confirma la acción

**Importante:**
- La restauración crea un nuevo registro en el histórico marcado como `[RESTAURADO]`
- No se pierde ningún dato del histórico
- El análisis restaurado se convierte en el análisis actual del producto

---

## 🗑️ Eliminar Análisis

### ¿Qué Pasa al Eliminar?

Cuando eliminas el análisis actual de un producto:

- ✅ El análisis actual se borra
- ✅ El producto queda sin análisis ("No tiene")
- ✅ **El histórico se preserva completamente**
- ✅ Se crea un registro en el histórico marcado como `[ELIMINADO]`
- ✅ Puedes empezar de cero con un nuevo análisis
- ✅ Puedes restaurar cualquier análisis del histórico en cualquier momento

### Cómo Eliminar

1. Abre el detalle del producto
2. Haz clic en **"🗑️ Borrar análisis"**
3. Confirma la eliminación en el modal
4. El análisis se eliminará pero el histórico se mantendrá

### Empezar de Cero

Después de eliminar, puedes:

1. Hacer clic en **"Analizar producto"** nuevamente
2. La IA analizará desde cero, usando el título/descripción original de MELI
3. Esto es útil si quieres "resetear" y empezar una nueva línea de evolución

---

## 🎯 Mejores Prácticas

### Para Obtener Mejores Resultados

1. **Analiza productos importantes primero**: Enfócate en los productos con más ventas
2. **Implementa las sugerencias**: Los mejores resultados vienen de aplicar las sugerencias en MELI
3. **Re-analiza después de implementar**: Deja que la IA evolucione sobre tus cambios
4. **Usa el score como guía**: Productos con score bajo necesitan más atención
5. **Revisa el histórico**: Aprende de la evolución de tus análisis

### Frecuencia Recomendada

- **Análisis inicial**: Analiza todos tus productos principales
- **Re-análisis**: Una vez al mes o cuando cambies algo importante
- **Seguimiento**: Revisa los scores semanalmente

### Limitaciones

- Los análisis son sugerencias, no cambios automáticos
- Debes aplicar manualmente las sugerencias en MercadoLibre
- La calidad depende del proveedor de IA configurado
- Keywords trending se actualizan de MercadoLibre periódicamente

---

## 🔍 Entender los Scores

### Escala de Puntuación

| Score | Significado | Acción Recomendada |
|-------|-------------|-------------------|
| **9-10** | Excelente | Mantener y monitorear |
| **7-8** | Muy bueno | Pequeñas mejoras posibles |
| **5-6** | Bueno | Re-analizar para mejorar |
| **3-4** | Regular | Implementar sugerencias urgentemente |
| **0-2** | Pobre | Requiere optimización completa |

### Factores que Afectan el Score

- Uso de keywords trending en título y descripción
- Completitud de la información del producto
- Calidad de la redacción
- Presencia de atributos importantes
- Optimización para búsquedas

---

## 💡 Consejos y Trucos

### Maximizar el Valor

1. **Lee las explicaciones**: La IA explica por qué sugiere cada cambio
2. **Compara con competidores**: Usa la info de productos similares
3. **Prueba diferentes versiones**: El re-análisis puede dar ideas nuevas
4. **Mantén el histórico**: Es tu registro de evolución y aprendizaje

### Errores Comunes a Evitar

- ❌ Re-analizar sin implementar las sugerencias previas
- ❌ Ignorar keywords trending importantes
- ❌ No revisar el histórico antes de cambiar todo
- ❌ Eliminar el análisis sin guardar las sugerencias que te gustaron

---

## 🆘 Solución de Problemas

### "No puedo conectar mi cuenta de MELI"

- Verifica que estás usando tu cuenta de vendedor
- Revisa que hayas autorizado todos los permisos
- Contacta al administrador si el problema persiste

### "El análisis tarda mucho"

- Los análisis pueden tomar 10-30 segundos (es normal)
- No cierres la ventana mientras analiza
- Si tarda más de 1 minuto, recarga la página e intenta de nuevo

### "El score bajó después del re-análisis"

- Puede ocurrir si la IA detecta nuevas áreas de mejora
- Revisa las nuevas sugerencias, pueden ser más completas
- Puedes restaurar el análisis anterior si lo prefieres

### "No veo mis productos"

- Verifica que tu cuenta de MELI esté conectada
- Haz clic en "Sincronizar ahora" para actualizar
- Solo se muestran publicaciones activas

---

## 📱 Contacto y Soporte

Si necesitas ayuda o tienes preguntas:

- Revisa esta guía primero
- Contacta al administrador de la plataforma
- Reporta bugs o problemas técnicos

---

**Última actualización:** Enero 2026
**Versión:** 1.0
