import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            MLP Optimizador MELI
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Optimiza tus publicaciones de MercadoLibre con análisis inteligente
            y recomendaciones basadas en datos
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              Comenzar
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
            >
              Iniciar Sesión
            </Link>
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold mb-2">Análisis Completo</h3>
              <p className="text-gray-600">
                Analiza tus publicaciones y descubre oportunidades de mejora
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2">Keywords Trending</h3>
              <p className="text-gray-600">
                Optimiza tus títulos con las palabras clave más buscadas
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-lg font-semibold mb-2">Aumenta Ventas</h3>
              <p className="text-gray-600">
                Mejora la visibilidad y conversión de tus productos
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
