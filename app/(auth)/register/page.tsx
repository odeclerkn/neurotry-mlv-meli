'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      // Auto-login después de registro
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-light py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Nombre de la aplicación */}
        <div className="text-center">
          <h1 className="text-4xl font-sans font-bold text-primary-900 mb-2">
            Neurotry - Optimizador de publicaciones MELI
          </h1>
          <p className="text-lg font-body text-neutral-600">
            Potencia tus ventas con IA
          </p>
        </div>

        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Crear Cuenta
            </CardTitle>
            <CardDescription className="text-center">
              Regístrate para comenzar a optimizar tus publicaciones
            </CardDescription>
          </CardHeader>

        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert variant="success">
                <AlertDescription>
                  Cuenta creada exitosamente. Redirigiendo...
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Juan Pérez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
              <p className="text-xs text-gray-500">Mínimo 6 caracteres</p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creando cuenta...' : 'Registrarse'}
            </Button>

            <p className="text-sm text-center font-body text-neutral-600">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-primary-500 hover:text-primary-700 hover:underline font-semibold">
                Inicia sesión aquí
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      </div>
    </div>
  )
}
