import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function ValuePropositionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-light">
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-primary-600 hover:text-primary-700 font-body text-sm mb-4 inline-block">
            ← Volver al Dashboard
          </Link>
          <h1 className="text-4xl font-sans font-bold text-primary-900 mb-3">
            ¿Por qué optimizar tus publicaciones con IA?
          </h1>
          <p className="text-lg font-body text-neutral-600">
            Descubre cómo la inteligencia artificial puede mejorar tus ventas en MercadoLibre
          </p>
        </div>

        {/* Resumen Ejecutivo */}
        <Card className="mb-8 border-2 border-primary-200 bg-primary-50">
          <CardHeader>
            <CardTitle className="text-2xl text-primary-900">Resumen Ejecutivo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-body text-neutral-700 text-base leading-relaxed mb-4">
              Esta herramienta utiliza <strong>Inteligencia Artificial</strong> para analizar tus publicaciones de MercadoLibre
              y compararlas con los productos más exitosos de tu categoría. El resultado: sugerencias concretas y accionables
              para mejorar tu visibilidad, aumentar tus conversiones y vender más.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white p-4 rounded-lg border border-primary-200">
                <div className="text-3xl mb-2">📈</div>
                <div className="font-sans font-bold text-primary-900">Más Visibilidad</div>
                <div className="text-sm font-body text-neutral-600">Aparece en más búsquedas</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-primary-200">
                <div className="text-3xl mb-2">💰</div>
                <div className="font-sans font-bold text-primary-900">Más Ventas</div>
                <div className="text-sm font-body text-neutral-600">Convierte más visitantes</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-primary-200">
                <div className="text-3xl mb-2">⚡</div>
                <div className="font-sans font-bold text-primary-900">Ahorra Tiempo</div>
                <div className="text-sm font-body text-neutral-600">Automatiza el análisis</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sección para NO técnicos */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="default" className="bg-blue-500">Para dueños de negocio</Badge>
            </div>
            <CardTitle className="text-2xl text-primary-900">¿Qué problema resuelve?</CardTitle>
            <CardDescription className="text-base">
              Entendé el valor sin necesitar conocimientos técnicos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Problema */}
            <div>
              <h3 className="font-sans font-bold text-lg text-neutral-900 mb-3">El Problema</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <ul className="space-y-2 font-body text-neutral-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✗</span>
                    <span>Tus productos no aparecen en las búsquedas de MercadoLibre</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✗</span>
                    <span>Competidores con productos similares venden mucho más que vos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✗</span>
                    <span>No sabés qué palabras clave usar en tus títulos y descripciones</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✗</span>
                    <span>Revisando manualmente cada publicación te lleva horas</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Solución */}
            <div>
              <h3 className="font-sans font-bold text-lg text-neutral-900 mb-3">La Solución</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <ul className="space-y-3 font-body text-neutral-700">
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-xl flex-shrink-0">1.</span>
                    <div>
                      <strong>Análisis Automático:</strong> La IA revisa cada publicación y detecta qué está faltando
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-xl flex-shrink-0">2.</span>
                    <div>
                      <strong>Comparación con Exitosos:</strong> Compara tus productos con los más vendidos de tu categoría
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-xl flex-shrink-0">3.</span>
                    <div>
                      <strong>Sugerencias Específicas:</strong> Te da un título y descripción optimizados, listos para copiar y pegar
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-xl flex-shrink-0">4.</span>
                    <div>
                      <strong>Score de Calidad:</strong> Recibís un puntaje (0 a 10) que te dice qué tan optimizada está cada publicación
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Ejemplo Práctico */}
            <div>
              <h3 className="font-sans font-bold text-lg text-neutral-900 mb-3">Ejemplo Práctico</h3>
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                <div className="mb-4">
                  <div className="text-sm font-sans font-semibold text-red-600 mb-1">❌ Título Original (Score: 4/10)</div>
                  <div className="font-body text-neutral-900 bg-white p-3 rounded border border-neutral-200">
                    Celular Samsung nuevo
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-sm font-sans font-semibold text-green-600 mb-1">✅ Título Optimizado (Score: 9/10)</div>
                  <div className="font-body text-neutral-900 bg-white p-3 rounded border border-green-300 border-2">
                    Samsung Galaxy A54 5G 128GB Violeta - 120Hz - Cámara 50MP
                  </div>
                </div>
                <div className="mt-3 text-sm font-body text-neutral-600">
                  <strong>¿Qué cambió?</strong>
                  <ul className="mt-2 space-y-1 ml-4">
                    <li>• Agregado modelo específico (Galaxy A54)</li>
                    <li>• Incluye palabras clave trending (5G, 120Hz, 50MP)</li>
                    <li>• Especifica capacidad y color</li>
                    <li>• Aproveча los 60 caracteres permitidos</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Beneficios Medibles */}
            <div>
              <h3 className="font-sans font-bold text-lg text-neutral-900 mb-3">Beneficios Medibles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-primary-200 rounded-lg p-4">
                  <div className="text-2xl mb-2">🔍</div>
                  <div className="font-sans font-bold text-primary-900 mb-1">Mejor Posicionamiento</div>
                  <div className="text-sm font-body text-neutral-600">
                    Tus productos aparecen en más búsquedas porque usás las palabras clave correctas
                  </div>
                </div>
                <div className="bg-white border border-primary-200 rounded-lg p-4">
                  <div className="text-2xl mb-2">👥</div>
                  <div className="font-sans font-bold text-primary-900 mb-1">Más Visitas</div>
                  <div className="text-sm font-body text-neutral-600">
                    Títulos claros y completos atraen más clics desde los resultados de búsqueda
                  </div>
                </div>
                <div className="bg-white border border-primary-200 rounded-lg p-4">
                  <div className="text-2xl mb-2">💵</div>
                  <div className="font-sans font-bold text-primary-900 mb-1">Mayor Conversión</div>
                  <div className="text-sm font-body text-neutral-600">
                    Descripciones completas y profesionales generan más confianza y cierran más ventas
                  </div>
                </div>
                <div className="bg-white border border-primary-200 rounded-lg p-4">
                  <div className="text-2xl mb-2">⏱️</div>
                  <div className="font-sans font-bold text-primary-900 mb-1">Ahorro de Tiempo</div>
                  <div className="text-sm font-body text-neutral-600">
                    Lo que te llevaría horas de investigación manual, la IA lo hace en segundos
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sistema de Re-Análisis Evolutivo */}
        <Card className="mb-8 border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="default" className="bg-purple-600">Funcionalidad avanzada</Badge>
            </div>
            <CardTitle className="text-2xl text-primary-900">Sistema de Re-Análisis Evolutivo</CardTitle>
            <CardDescription className="text-base">
              La IA aprende de cada análisis y mejora progresivamente tus publicaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-sans font-bold text-lg text-neutral-900 mb-3">¿Qué es el Re-Análisis Evolutivo?</h3>
              <div className="bg-white border border-purple-200 rounded-lg p-4">
                <p className="text-sm font-body text-neutral-700 mb-3">
                  Cada vez que re-analizas un producto, la IA <strong>NO parte de cero</strong>. En cambio:
                </p>
                <ul className="space-y-2 text-sm font-body text-neutral-700">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">1.</span>
                    <span><strong>Toma como base</strong> las sugerencias previas (no el original de MELI)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">2.</span>
                    <span><strong>Evoluciona</strong> esas sugerencias para hacerlas aún mejores</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">3.</span>
                    <span><strong>Busca nuevas oportunidades</strong> de mejora basándose en lo ya optimizado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">4.</span>
                    <span><strong>Construye sobre el trabajo anterior</strong> como un experto que refina su trabajo</span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-sans font-bold text-lg text-neutral-900 mb-3">Ejemplo de Evolución</h3>
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-xs font-sans font-bold text-red-700 mb-2">📍 ORIGINAL de MercadoLibre</div>
                  <div className="font-body text-neutral-900 text-sm">
                    "Zapatillas Nike"
                  </div>
                </div>

                <div className="text-center text-2xl">↓</div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-xs font-sans font-bold text-yellow-700 mb-2">🤖 Análisis 1 - Score: 6/10</div>
                  <div className="font-body text-neutral-900 text-sm">
                    "Zapatillas Nike Running Air Max - Hombre y Mujer"
                  </div>
                </div>

                <div className="text-center text-2xl">↓</div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-xs font-sans font-bold text-blue-700 mb-2">🤖 Re-Análisis 2 (evoluciona el anterior) - Score: 8/10</div>
                  <div className="font-body text-neutral-900 text-sm">
                    "Zapatillas Nike Running Air Max 2024 - Deportivas Unisex - Envío Gratis"
                  </div>
                </div>

                <div className="text-center text-2xl">↓</div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-xs font-sans font-bold text-green-700 mb-2">🤖 Re-Análisis 3 (mejora continua) - Score: 9/10</div>
                  <div className="font-body text-neutral-900 text-sm">
                    "Zapatillas Nike Air Max 2024 Running Deportivas Unisex Original - Envío Gratis CABA"
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4">
              <h4 className="font-sans font-bold text-purple-900 mb-3 flex items-center gap-2">
                <span>💡</span> Cuándo Re-Analizar
              </h4>
              <ul className="space-y-2 text-sm font-body text-purple-900">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Ya implementaste las sugerencias anteriores en MELI</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Quieres seguir mejorando un producto importante</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Han pasado varias semanas y cambiaron las tendencias</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">✗</span>
                  <span>NO re-analices sin implementar las sugerencias previas (la IA necesita evolucionar sobre cambios reales)</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Análisis */}
        <Card className="mb-8 border-2 border-amber-200 bg-amber-50">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="default" className="bg-amber-600">Historial completo</Badge>
            </div>
            <CardTitle className="text-2xl text-primary-900">Histórico de Análisis</CardTitle>
            <CardDescription className="text-base">
              Todos tus análisis se guardan automáticamente para que puedas consultarlos y restaurarlos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-sans font-bold text-lg text-neutral-900 mb-3">¿Qué guarda el histórico?</h3>
              <div className="bg-white border border-amber-200 rounded-lg p-4">
                <ul className="space-y-2 text-sm font-body text-neutral-700">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">📝</span>
                    <span><strong>Todos los análisis realizados:</strong> Cada vez que analizas o re-analizas, se guarda un registro completo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">📅</span>
                    <span><strong>Fecha y hora exactas:</strong> Sabes cuándo se hizo cada análisis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">🤖</span>
                    <span><strong>Proveedor de IA usado:</strong> Claude, GPT-4, o Gemini</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">📊</span>
                    <span><strong>Score obtenido:</strong> La puntuación de 0-10 de ese análisis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">💡</span>
                    <span><strong>Sugerencias completas:</strong> Título, descripción y explicación de mejoras</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">♻️</span>
                    <span><strong>Eventos especiales:</strong> Se marca si fue eliminado o restaurado</span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-sans font-bold text-lg text-neutral-900 mb-3">Restaurar Análisis Anteriores</h3>
              <div className="bg-white border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-body text-neutral-700 mb-3">
                  ¿Las nuevas sugerencias no te convencieron? ¿Preferís una versión anterior?
                  <strong> Podés restaurar cualquier análisis del histórico como actual</strong> con un solo click.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
                  <p className="text-xs font-body text-blue-900">
                    <strong>💡 Tip:</strong> Restaurar crea un nuevo registro en el histórico marcado como [RESTAURADO],
                    así que nunca perdés información y siempre podés volver atrás.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-sans font-bold text-lg text-neutral-900 mb-3">Eliminar vs Empezar de Cero</h3>
              <div className="bg-white border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-body text-neutral-700 mb-3">
                  Cuando eliminás el análisis actual:
                </p>
                <ul className="space-y-2 text-sm font-body text-neutral-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>El análisis actual se borra (el producto queda "sin análisis")</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>El histórico se preserva completamente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Se registra en el histórico que fue eliminado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>El próximo análisis partirá desde cero (usando el original de MELI)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Podés restaurar cualquier análisis anterior cuando quieras</span>
                  </li>
                </ul>
                <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mt-3">
                  <p className="text-xs font-body text-yellow-900">
                    <strong>⚠️ Importante:</strong> Esto es útil si querés "resetear" y empezar una nueva línea de evolución,
                    pero no pierdas las sugerencias anteriores - están en el histórico.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guía Visual - Entendiendo la interfaz */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="default" className="bg-green-600">Guía visual</Badge>
            </div>
            <CardTitle className="text-2xl text-primary-900">Entendiendo la interfaz</CardTitle>
            <CardDescription className="text-base">
              Qué significa cada elemento, color y número que ves en la herramienta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score de Keywords */}
            <div>
              <h3 className="font-sans font-bold text-lg text-neutral-900 mb-3">¿Qué es el score 8/10 en los keywords?</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-body text-neutral-700 mb-3">
                  El score (ej: <strong className="px-2 py-1 bg-primary-100 rounded text-primary-700">8/10</strong>) indica
                  <strong> qué tan relevante es ese keyword específico para tu producto</strong>.
                </p>
                <div className="space-y-2 text-sm font-body text-neutral-700">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-green-600">9-10:</span>
                    <span>Muy relevante - El keyword describe perfectamente tu producto (atributo clave)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-blue-600">7-8:</span>
                    <span>Relevante - Aplica a tu producto y puede atraer clientes interesados</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-yellow-600">5-6:</span>
                    <span>Moderadamente relevante - Aplica pero no es central</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-orange-600">3-4:</span>
                    <span>Poco relevante - Apenas relacionado con tu producto</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-red-600">0-2:</span>
                    <span>No relevante - No aplica a tu producto específico</span>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-white rounded border border-blue-300">
                  <p className="text-xs font-body text-neutral-700">
                    <strong>Ejemplo:</strong> Si vendés un "Samsung Galaxy A54 5G", el keyword "5G" tendrá score 9/10 porque describe
                    una característica clave. Pero el keyword "iPhone" tendrá 0/10 porque no aplica.
                  </p>
                </div>
              </div>
            </div>

            {/* Colores de keywords */}
            <div>
              <h3 className="font-sans font-bold text-lg text-neutral-900 mb-3">¿Qué significan los colores en los keywords?</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex-shrink-0 mt-0.5"></div>
                  <div>
                    <div className="font-sans font-bold text-green-900 mb-1">Verde: Relevante y ya usado</div>
                    <p className="text-sm font-body text-green-800">
                      Este keyword es relevante para tu producto <strong>Y</strong> ya lo estás usando en el título o descripción.
                      <strong> ¡Perfecto!</strong> Seguí así.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-yellow-500 flex-shrink-0 mt-0.5"></div>
                  <div>
                    <div className="font-sans font-bold text-yellow-900 mb-1">Amarillo: Relevante pero NO usado (oportunidad)</div>
                    <p className="text-sm font-body text-yellow-800">
                      Este keyword es relevante para tu producto pero <strong>NO</strong> aparece en tu título ni descripción.
                      <strong> ¡Oportunidad de mejora!</strong> Considera agregarlo.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex-shrink-0 mt-0.5"></div>
                  <div>
                    <div className="font-sans font-bold text-red-900 mb-1">Rojo: No relevante</div>
                    <p className="text-sm font-body text-red-800">
                      Este keyword <strong>NO</strong> es relevante para tu producto específico. No lo uses,
                      aunque esté de moda, porque confundiría a los compradores.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-gray-400 flex-shrink-0 mt-0.5"></div>
                  <div>
                    <div className="font-sans font-bold text-gray-900 mb-1">Gris: Sin analizar</div>
                    <p className="text-sm font-body text-gray-800">
                      Este keyword todavía no fue analizado por la IA. Hace click en "Analizar con IA" para obtener el score y la recomendación.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Score de publicación */}
            <div>
              <h3 className="font-sans font-bold text-lg text-neutral-900 mb-3">¿Qué es el score 7/10 de mi publicación?</h3>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm font-body text-neutral-700 mb-3">
                  El <strong>score de optimización</strong> (de 0 a 10) evalúa qué tan bien optimizada está tu publicación completa.
                  La IA considera múltiples factores:
                </p>
                <ul className="space-y-2 text-sm font-body text-neutral-700 mb-3">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <span><strong>Uso de keywords relevantes:</strong> ¿Incluís los términos importantes?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <span><strong>Completitud:</strong> ¿Tenés todos los atributos necesarios?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <span><strong>Claridad del título:</strong> ¿Es específico y aprovecha los 60 caracteres?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <span><strong>Calidad de descripción:</strong> ¿Es profesional, completa y bien estructurada?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <span><strong>Competitividad:</strong> ¿Cómo te comparás con productos similares exitosos?</span>
                  </li>
                </ul>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                  <div className="bg-green-100 border border-green-300 rounded p-2 text-center">
                    <div className="font-sans font-bold text-green-900">8-10</div>
                    <div className="text-xs text-green-800">Excelente optimización</div>
                  </div>
                  <div className="bg-yellow-100 border border-yellow-300 rounded p-2 text-center">
                    <div className="font-sans font-bold text-yellow-900">5-7</div>
                    <div className="text-xs text-yellow-800">Puede mejorar</div>
                  </div>
                  <div className="bg-red-100 border border-red-300 rounded p-2 text-center">
                    <div className="font-sans font-bold text-red-900">0-4</div>
                    <div className="text-xs text-red-800">Necesita optimización</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Badges en la lista */}
            <div>
              <h3 className="font-sans font-bold text-lg text-neutral-900 mb-3">Otros elementos de la interfaz</h3>
              <div className="space-y-3 text-sm font-body text-neutral-700">
                <div className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded">
                  <Badge variant="success" className="flex-shrink-0">Claude</Badge>
                  <div>
                    <strong>Proveedor de IA:</strong> Indica qué modelo de inteligencia artificial analizó tu publicación
                    (Claude, GPT-4, Gemini o Básico). Todos dan resultados de calidad similares.
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded">
                  <div className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded flex-shrink-0">NEW</div>
                  <div>
                    <strong>Badge NEW:</strong> El producto fue agregado recientemente (última sincronización).
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded">
                  <div className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded flex-shrink-0">UPD</div>
                  <div>
                    <strong>Badge UPD:</strong> El producto fue actualizado desde la última sincronización.
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded">
                  <span className="text-xl flex-shrink-0">✨</span>
                  <div>
                    <strong>Análisis IA:</strong> Cuando ves este ícono, significa que hay sugerencias de optimización disponibles.
                    Haz click en la fila para verlas completas.
                  </div>
                </div>
              </div>
            </div>

            {/* Pro tips */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-4">
              <h4 className="font-sans font-bold text-blue-900 mb-3 flex items-center gap-2">
                <span>💡</span> Pro Tips
              </h4>
              <ul className="space-y-2 text-sm font-body text-blue-900">
                <li className="flex items-start gap-2">
                  <span className="font-bold">•</span>
                  <span>Pasá el mouse sobre el texto cortado para ver el contenido completo en un tooltip</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">•</span>
                  <span>El botón "Re-analizar" te permite actualizar las sugerencias si cambiaron las keywords trending</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">•</span>
                  <span>Podés borrar un análisis con el botón "Borrar análisis" si querés empezar de cero</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">•</span>
                  <span>La fecha de última sincronización te ayuda a saber si tus datos están actualizados</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Sección para técnicos */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="default" className="bg-purple-500">Para desarrolladores y técnicos</Badge>
            </div>
            <CardTitle className="text-2xl text-primary-900">¿Cómo funciona técnicamente?</CardTitle>
            <CardDescription className="text-base">
              Arquitectura, flujo de datos y tecnologías utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stack Tecnológico */}
            <div>
              <h3 className="font-sans font-bold text-lg text-neutral-900 mb-3">Stack Tecnológico</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-neutral-50 border border-neutral-200 rounded p-3 text-center">
                  <div className="font-sans font-bold text-sm text-neutral-900">Next.js 14</div>
                  <div className="text-xs font-body text-neutral-600">App Router</div>
                </div>
                <div className="bg-neutral-50 border border-neutral-200 rounded p-3 text-center">
                  <div className="font-sans font-bold text-sm text-neutral-900">Supabase</div>
                  <div className="text-xs font-body text-neutral-600">PostgreSQL + Auth</div>
                </div>
                <div className="bg-neutral-50 border border-neutral-200 rounded p-3 text-center">
                  <div className="font-sans font-bold text-sm text-neutral-900">Claude/GPT-4</div>
                  <div className="text-xs font-body text-neutral-600">Multi-provider AI</div>
                </div>
                <div className="bg-neutral-50 border border-neutral-200 rounded p-3 text-center">
                  <div className="font-sans font-bold text-sm text-neutral-900">MELI API</div>
                  <div className="text-xs font-body text-neutral-600">OAuth2</div>
                </div>
              </div>
            </div>

            {/* Cómo funciona paso a paso */}
            <div>
              <h3 className="font-sans font-bold text-lg text-neutral-900 mb-3">¿Cómo funciona el proceso completo?</h3>
              <div className="space-y-4">
                <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-sans font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <div className="font-sans font-bold text-neutral-900 mb-1">Sincronización de Productos</div>
                      <p className="text-sm font-body text-neutral-700">
                        La aplicación se conecta a MercadoLibre y obtiene toda la información de tus publicaciones: títulos,
                        descripciones, precios, stock, imágenes y atributos. Usa la <em>API de Items de MELI</em> para traer
                        los datos completos de cada producto (endpoint <code className="text-xs bg-neutral-100 px-1 rounded">/items/&#123;id&#125;</code>).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-sans font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <div className="font-sans font-bold text-neutral-900 mb-1">Obtención de Keywords Trending</div>
                      <p className="text-sm font-body text-neutral-700">
                        Para cada categoría de tus productos, la herramienta consulta las palabras clave más buscadas en
                        MercadoLibre en este momento. Usa la <em>API de Trends de MELI</em> (endpoint <code className="text-xs bg-neutral-100 px-1 rounded">/trends/MLA/&#123;category_id&#125;</code>)
                        para conocer qué términos están usando los compradores. Los resultados se guardan en caché por 24 horas.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-sans font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <div className="font-sans font-bold text-neutral-900 mb-1">Análisis de Competidores</div>
                      <p className="text-sm font-body text-neutral-700">
                        La aplicación busca los productos más vendidos de tu misma categoría para identificar qué hacen bien.
                        Usa la <em>API de Search de MELI</em> ordenando por cantidad vendida (endpoint <code className="text-xs bg-neutral-100 px-1 rounded">/sites/MLA/search?sort=sold_quantity_desc</code>)
                        y extrae los keywords comunes en los títulos y descripciones de los top 10.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-sans font-bold flex-shrink-0">
                      4
                    </div>
                    <div>
                      <div className="font-sans font-bold text-neutral-900 mb-1">Análisis con Inteligencia Artificial</div>
                      <p className="text-sm font-body text-neutral-700">
                        Toda la información recopilada (tu producto, keywords trending, competidores exitosos) se envía a la IA
                        (Claude de Anthropic, GPT-4 de OpenAI, o Gemini de Google). La IA analiza todo en conjunto y genera
                        sugerencias específicas: título optimizado, descripción mejorada, score de calidad, y explicación
                        detallada de por qué sugiere cada cambio. El proceso toma entre 5-10 segundos por producto.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-sans font-bold flex-shrink-0">
                      5
                    </div>
                    <div>
                      <div className="font-sans font-bold text-neutral-900 mb-1">Guardado del Análisis</div>
                      <p className="text-sm font-body text-neutral-700">
                        El análisis se guarda en la base de datos de forma segura. Se actualiza el análisis actual del producto
                        y se crea un registro en el histórico para que nunca pierdas las sugerencias previas. Cada usuario
                        solo puede ver sus propios datos gracias a las políticas de seguridad Row Level Security.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-sans font-bold flex-shrink-0">
                      6
                    </div>
                    <div>
                      <div className="font-sans font-bold text-neutral-900 mb-1">Visualización y Exportación</div>
                      <p className="text-sm font-body text-neutral-700">
                        Los análisis se muestran en tu dashboard de forma clara y organizada. Podés ver los detalles completos
                        haciendo click en cada producto, comparar el histórico, restaurar versiones anteriores, y exportar
                        todo a Excel para trabajar offline o compartir con tu equipo.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Algoritmo de Scoring */}
            <div>
              <h3 className="font-sans font-bold text-lg text-neutral-900 mb-3">Algoritmo de Scoring</h3>
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                <p className="text-sm font-body text-neutral-700 mb-3">
                  El score (0-10) es calculado por la IA considerando:
                </p>
                <ul className="space-y-2 text-sm font-body text-neutral-700">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 font-bold">•</span>
                    <span><strong>Uso de keywords relevantes:</strong> ¿Incluye términos trending que aplican al producto?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 font-bold">•</span>
                    <span><strong>Completitud de información:</strong> ¿Tiene todos los atributos importantes?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 font-bold">•</span>
                    <span><strong>Claridad del título:</strong> ¿Es específico y usa bien los 60 caracteres?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 font-bold">•</span>
                    <span><strong>Calidad de descripción:</strong> ¿Es profesional, completa y estructura beneficios?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 font-bold">•</span>
                    <span><strong>Competitividad:</strong> ¿Cómo se compara con productos similares exitosos?</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Seguridad */}
            <div>
              <h3 className="font-sans font-bold text-lg text-neutral-900 mb-3">Seguridad y Privacidad</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="font-sans font-bold text-sm text-green-900 mb-2">✓ Row Level Security (RLS)</div>
                  <div className="text-xs font-body text-green-800">
                    Cada usuario solo ve sus propios datos. Políticas a nivel de base de datos.
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="font-sans font-bold text-sm text-green-900 mb-2">✓ Tokens Encriptados</div>
                  <div className="text-xs font-body text-green-800">
                    Access tokens de MercadoLibre almacenados con encriptación en BD.
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="font-sans font-bold text-sm text-green-900 mb-2">✓ No-Training Policy</div>
                  <div className="text-xs font-body text-green-800">
                    OpenAI/Anthropic/Google no entrenan modelos con los datos enviados.
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="font-sans font-bold text-sm text-green-900 mb-2">✓ Variables de Entorno</div>
                  <div className="text-xs font-body text-green-800">
                    API keys nunca en código, siempre en .env.local.
                  </div>
                </div>
              </div>
            </div>

            {/* Documentación Completa */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-sans font-bold text-purple-900 mb-2">📚 Documentación Técnica Completa</h4>
              <p className="text-sm font-body text-purple-800 mb-3">
                Para más detalles sobre el flujo de datos, arquitectura y troubleshooting, consultá:
              </p>
              <code className="bg-purple-900 text-purple-100 px-3 py-1 rounded font-mono text-xs">
                /docs/PIPELINE.md
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Cómo Medir el Valor */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-primary-900">¿Cómo medir el impacto?</CardTitle>
            <CardDescription className="text-base">
              Métricas clave para evaluar si la optimización está funcionando
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-sans font-bold text-lg text-blue-900 mb-4">Proceso de Medición Recomendado</h3>

              <div className="space-y-4">
                {/* Paso 1 */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-sans font-bold">
                    1
                  </div>
                  <div>
                    <div className="font-sans font-bold text-neutral-900 mb-1">Baseline (Antes)</div>
                    <div className="text-sm font-body text-neutral-700">
                      Anotá las métricas actuales de tus productos en MercadoLibre:
                      <ul className="mt-2 ml-4 space-y-1">
                        <li>• Vistas por semana</li>
                        <li>• Tasa de conversión (ventas/vistas)</li>
                        <li>• Posición promedio en búsquedas relevantes</li>
                        <li>• Cantidad de favoritos</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Paso 2 */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-sans font-bold">
                    2
                  </div>
                  <div>
                    <div className="font-sans font-bold text-neutral-900 mb-1">Aplicar Optimizaciones</div>
                    <div className="text-sm font-body text-neutral-700">
                      Usá las sugerencias de la IA para actualizar tus publicaciones:
                      <ul className="mt-2 ml-4 space-y-1">
                        <li>• Copiar título optimizado → Editar publicación en MELI</li>
                        <li>• Copiar descripción optimizada → Actualizar texto</li>
                        <li>• Agregar atributos faltantes sugeridos</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Paso 3 */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-sans font-bold">
                    3
                  </div>
                  <div>
                    <div className="font-sans font-bold text-neutral-900 mb-1">Esperar 7-14 días</div>
                    <div className="text-sm font-body text-neutral-700">
                      Darle tiempo al algoritmo de MercadoLibre para re-indexar tus publicaciones optimizadas.
                    </div>
                  </div>
                </div>

                {/* Paso 4 */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-sans font-bold">
                    4
                  </div>
                  <div>
                    <div className="font-sans font-bold text-neutral-900 mb-1">Comparar Resultados (Después)</div>
                    <div className="text-sm font-body text-neutral-700">
                      Revisá las mismas métricas y compará:
                      <ul className="mt-2 ml-4 space-y-1">
                        <li>• ¿Aumentaron las vistas?</li>
                        <li>• ¿Mejoró la tasa de conversión?</li>
                        <li>• ¿Subiste posiciones en búsquedas?</li>
                        <li>• ¿Más usuarios agregaron a favoritos?</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* KPIs Clave */}
            <div>
              <h3 className="font-sans font-bold text-lg text-neutral-900 mb-3">KPIs Clave a Trackear</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-2xl">📊</div>
                    <div className="font-sans font-bold text-neutral-900">Impresiones y Vistas</div>
                  </div>
                  <div className="text-sm font-body text-neutral-600">
                    Mejor SEO → más apariciones en búsquedas → más vistas. Objetivo: +30-50% en 2 semanas.
                  </div>
                </div>
                <div className="border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-2xl">💰</div>
                    <div className="font-sans font-bold text-neutral-900">Tasa de Conversión</div>
                  </div>
                  <div className="text-sm font-body text-neutral-600">
                    Mejor descripción → más confianza → más ventas. Objetivo: +10-20% en conversión.
                  </div>
                </div>
                <div className="border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-2xl">🔍</div>
                    <div className="font-sans font-bold text-neutral-900">Ranking en Búsquedas</div>
                  </div>
                  <div className="text-sm font-body text-neutral-600">
                    Keywords optimizados → mejor posición. Buscá tu producto y verificá tu ranking.
                  </div>
                </div>
                <div className="border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-2xl">⭐</div>
                    <div className="font-sans font-bold text-neutral-900">Favoritos y Preguntas</div>
                  </div>
                  <div className="text-sm font-body text-neutral-600">
                    Publicaciones claras generan más interés y engagement. Objetivo: +20% en favoritos.
                  </div>
                </div>
              </div>
            </div>

            {/* Caso de Estudio Hipotético */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-sans font-bold text-lg text-green-900 mb-3">📈 Ejemplo de Impacto Real</h3>
              <div className="space-y-3 text-sm font-body text-green-900">
                <p>
                  <strong>Escenario:</strong> Vendedor de electrónicos con 50 publicaciones activas
                </p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <div className="font-sans font-bold text-red-700 mb-2">Antes de Optimizar</div>
                    <ul className="space-y-1">
                      <li>• Vistas: 500/semana</li>
                      <li>• Conversión: 2%</li>
                      <li>• Ventas: 10/semana</li>
                      <li>• Score promedio: 4.5/10</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-sans font-bold text-green-700 mb-2">Después de Optimizar</div>
                    <ul className="space-y-1">
                      <li>• Vistas: 725/semana (+45%)</li>
                      <li>• Conversión: 2.8% (+40%)</li>
                      <li>• Ventas: 20/semana (+100%)</li>
                      <li>• Score promedio: 8.2/10</li>
                    </ul>
                  </div>
                </div>
                <p className="mt-4 bg-white border border-green-300 rounded p-3">
                  <strong>Resultado:</strong> Duplicó las ventas en 3 semanas aplicando las sugerencias de IA.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Por qué deberías usarlo */}
        <Card className="mb-8 border-2 border-success">
          <CardHeader>
            <CardTitle className="text-2xl text-primary-900">¿Por qué deberías usar esta herramienta?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-3xl">🎯</div>
                <div>
                  <div className="font-sans font-bold text-neutral-900 mb-1">Competencia Feroz</div>
                  <p className="text-sm font-body text-neutral-700">
                    MercadoLibre tiene millones de publicaciones. Si tus títulos y descripciones no están optimizados,
                    simplemente no apareceés en las búsquedas. Tus competidores ya están usando herramientas como esta.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-3xl">🤖</div>
                <div>
                  <div className="font-sans font-bold text-neutral-900 mb-1">Ventaja Tecnológica</div>
                  <p className="text-sm font-body text-neutral-700">
                    La IA puede analizar miles de publicaciones exitosas y detectar patrones que a simple vista son imposibles de ver.
                    Esto te da insights que manualmente te llevarían semanas obtener.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-3xl">⚡</div>
                <div>
                  <div className="font-sans font-bold text-neutral-900 mb-1">ROI Inmediato</div>
                  <p className="text-sm font-body text-neutral-700">
                    Con solo mejorar UNA publicación que te genere 2-3 ventas extra al mes, ya recuperaste el valor invertido.
                    Ahora multiplicá eso por todas tus publicaciones.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-3xl">📈</div>
                <div>
                  <div className="font-sans font-bold text-neutral-900 mb-1">Escalabilidad</div>
                  <p className="text-sm font-body text-neutral-700">
                    No importa si tenés 10 o 1000 productos. La herramienta analiza todo tu catálogo en minutos y te da
                    sugerencias específicas para cada uno. Imposible de hacer manualmente.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-3xl">🔄</div>
                <div>
                  <div className="font-sans font-bold text-neutral-900 mb-1">Mejora Continua</div>
                  <p className="text-sm font-body text-neutral-700">
                    Las keywords trending cambian. Lo que funcionaba hace 3 meses puede no funcionar hoy.
                    Re-analizar periódicamente te mantiene siempre competitivo.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-8 text-center text-white">
          <h2 className="text-3xl font-sans font-bold mb-3">¿Listo para optimizar tus publicaciones?</h2>
          <p className="text-lg font-body mb-6 opacity-90">
            Empezá ahora y descubrí cómo mejorar tus ventas con inteligencia artificial
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-white text-primary-700 font-sans font-bold px-8 py-3 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            Ir al Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
