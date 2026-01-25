import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-light">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-sans font-bold text-primary-900 mb-6">
            Neurotry - Optimizador de publicaciones MELI
          </h1>
          <p className="text-xl font-body text-neutral-600 mb-8">
            Optimiza tus publicaciones de MercadoLibre con análisis inteligente
            y recomendaciones basadas en IA
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-3 bg-gradient-primary text-white rounded-lg font-sans font-bold shadow-primary hover:shadow-primary-lg hover:scale-105 transition-all duration-200"
            >
              Comenzar
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 border-2 border-primary-500 text-primary-700 rounded-lg font-sans font-semibold hover:bg-primary-50 transition-all duration-200"
            >
              Iniciar Sesión
            </Link>
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 border-2 border-neutral-200 hover:border-primary-300">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-sans font-bold mb-3 text-neutral-900">Análisis Completo</h3>
              <p className="font-body text-neutral-600">
                Analiza tus publicaciones y descubre oportunidades de mejora
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 border-2 border-neutral-200 hover:border-primary-300">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-sans font-bold mb-3 text-neutral-900">Keywords Trending</h3>
              <p className="font-body text-neutral-600">
                Optimiza tus títulos con las palabras clave más buscadas
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 border-2 border-neutral-200 hover:border-primary-300">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="text-xl font-sans font-bold mb-3 text-neutral-900">Aumenta Ventas</h3>
              <p className="font-body text-neutral-600">
                Mejora la visibilidad y conversión de tus productos
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
