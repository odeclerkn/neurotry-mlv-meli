import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-light">
      {/* Header */}
      <header className="bg-white border-b-2 border-primary-200 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-sans font-bold text-primary-900 hover:text-primary-700 transition-colors">
                Neurotry - Optimizador de publicaciones MELI
              </Link>
              <nav className="hidden md:flex space-x-4">
                <Link
                  href="/dashboard"
                  className="font-body text-neutral-700 hover:text-primary-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors"
                >
                  Dashboard
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm font-body text-neutral-700">
                {user.email}
              </span>
              <form action={signOut}>
                <Button variant="outline" size="sm" type="submit">
                  Cerrar Sesión
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>{children}</main>
    </div>
  )
}
