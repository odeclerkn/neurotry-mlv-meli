# Plan Híbrido v2: MVP → MLP con Doble Autenticación

**Fecha:** Enero 2026
**Versión:** 2.0 (Arquitectura Corregida)
**Proyecto:** MLP Optimizador MELI
**Estrategia:** Supabase Auth + OAuth MELI sin dominio

---

## 🎯 Cambios vs v1

| Aspecto | v1 (Incorrecto) | v2 (Correcto) |
|---------|-----------------|---------------|
| **Autenticación** | Solo OAuth MELI | Supabase Auth + OAuth MELI |
| **Usuarios** | Usuarios de MELI | Usuarios propios de la app |
| **Flujo** | Directo a MELI | Login app → Conectar MELI |
| **Base de datos** | Solo tokens MELI | Users + Tokens MELI |

---

## 🏗️ Arquitectura Completa

### Stack Tecnológico MVP

```yaml
Frontend:
  Framework: Next.js 14 (App Router)
  UI: Tailwind CSS + Shadcn/ui
  State: React Context / Zustand
  Auth UI: Supabase Auth UI components

Backend:
  Runtime: Next.js API Routes
  Database: Supabase PostgreSQL (gratis)
  Auth: Supabase Auth (gratis)
  Cache: Upstash Redis (gratis 10K requests/día)

OAuth MELI:
  Método: Authorization Code Flow
  Tokens: Encriptados en PostgreSQL

Deploy MVP:
  Frontend: Vercel (gratis)
  Backend: Vercel Serverless (gratis)
  DB: Supabase (gratis hasta 500MB)
  Redis: Upstash (gratis)

Exposición sin dominio:
  Desarrollo: ngrok
  MVP Producción: Vercel (tuapp.vercel.app)

Costo total: $0
```

---

## 🔐 Sistema de Doble Autenticación

### Flujo Completo de Usuario

```
┌─────────────────────────────────────────────────────────┐
│ 1. Usuario llega a tu app                               │
│    https://mlp-meli.vercel.app                          │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. AUTENTICACIÓN 1: Supabase Auth                       │
│    ┌─────────────────────────────────────────────┐     │
│    │ Registrarse                                  │     │
│    │ Email: vendedor@example.com                  │     │
│    │ Password: ********                           │     │
│    │ [Crear cuenta]                               │     │
│    └─────────────────────────────────────────────┘     │
│                                                         │
│    o                                                    │
│                                                         │
│    ┌─────────────────────────────────────────────┐     │
│    │ Iniciar Sesión                               │     │
│    │ [Continuar con Google]                       │     │
│    └─────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Dashboard (vacío)                                    │
│    ┌─────────────────────────────────────────────┐     │
│    │ 📊 Mis Productos                             │     │
│    │                                              │     │
│    │ ⚠️ No has conectado MercadoLibre            │     │
│    │                                              │     │
│    │ Para ver tus publicaciones, conecta tu       │     │
│    │ cuenta de MercadoLibre                       │     │
│    │                                              │     │
│    │ [🔗 Conectar con MercadoLibre]               │     │
│    └─────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
                         ↓
                    Click botón
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 4. AUTENTICACIÓN 2: OAuth MercadoLibre                  │
│    Ventana/popup de mercadolibre.com                    │
│    ┌─────────────────────────────────────────────┐     │
│    │ Iniciar sesión en MercadoLibre              │     │
│    │ Usuario: tu_usuario_meli                     │     │
│    │ Contraseña: ********                         │     │
│    │                                              │     │
│    │ Esta aplicación solicita:                    │     │
│    │ ✓ Leer tus publicaciones                    │     │
│    │ ✓ Acceso offline                            │     │
│    │                                              │     │
│    │ [Autorizar] [Cancelar]                       │     │
│    └─────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
                         ↓
                    Click Autorizar
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Sincronización automática                            │
│    Backend obtiene tokens → sincroniza productos        │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Dashboard (con datos)                                │
│    ┌─────────────────────────────────────────────┐     │
│    │ 📊 Mis Productos (150)                       │     │
│    │ ✅ Conectado como: @tu_usuario_meli         │     │
│    │ Última sync: hace 2 minutos                  │     │
│    │                                              │     │
│    │ ┌────────────────────────────────────────┐  │     │
│    │ │ iPhone 15 Pro Max | $25,000 | Score: 8│  │     │
│    │ │ MacBook Air M2    | $18,500 | Score: 6│  │     │
│    │ │ iPad Pro 2024     | $15,000 | Score: 9│  │     │
│    │ └────────────────────────────────────────┘  │     │
│    │                                              │     │
│    │ [🔄 Sincronizar ahora] [Desconectar MELI]    │     │
│    └─────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ Schema de Base de Datos

```sql
-- ============================================
-- AUTENTICACIÓN 1: Usuarios de tu app
-- (Gestionado automáticamente por Supabase)
-- ============================================

-- auth.users (tabla interna de Supabase)
-- id: UUID
-- email: VARCHAR
-- encrypted_password: VARCHAR
-- email_confirmed_at: TIMESTAMP
-- created_at: TIMESTAMP
-- updated_at: TIMESTAMP

-- ============================================
-- AUTENTICACIÓN 2: Conexiones a MercadoLibre
-- ============================================

CREATE TABLE meli_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Datos del usuario de MELI
  meli_user_id BIGINT NOT NULL,
  meli_nickname VARCHAR(255),

  -- Tokens (encriptados)
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,

  -- Metadata
  connected_at TIMESTAMP DEFAULT NOW(),
  last_sync_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,

  -- Un usuario solo puede conectar una cuenta MELI
  UNIQUE(user_id)
);

CREATE INDEX idx_meli_connections_user_id ON meli_connections(user_id);
CREATE INDEX idx_meli_connections_expires ON meli_connections(expires_at);

-- ============================================
-- Productos sincronizados
-- ============================================

CREATE TABLE products (
  id VARCHAR(50) PRIMARY KEY,  -- MLM123456789
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Datos básicos
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12, 2),
  original_price DECIMAL(12, 2),
  currency_id VARCHAR(10),

  -- Ventas y estado
  sold_quantity INTEGER DEFAULT 0,
  available_quantity INTEGER DEFAULT 0,
  status VARCHAR(50),  -- active, paused, closed

  -- Categoría y clasificación
  category_id VARCHAR(50),
  category_name VARCHAR(255),
  listing_type_id VARCHAR(50),  -- gold_special, gold_pro, free

  -- URLs e imágenes
  permalink TEXT,
  thumbnail TEXT,

  -- Análisis (calculado por tu app)
  optimization_score INTEGER,  -- 0-100
  missing_keywords JSONB,
  suggested_title TEXT,
  suggested_description TEXT,

  -- Metadata
  raw_data JSONB,  -- Respuesta completa de MELI
  synced_at TIMESTAMP DEFAULT NOW(),
  analyzed_at TIMESTAMP,

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_score ON products(optimization_score);
CREATE INDEX idx_products_synced ON products(synced_at);

-- ============================================
-- OAuth state (para validar CSRF)
-- ============================================

CREATE TABLE oauth_states (
  state VARCHAR(64) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_oauth_states_expires ON oauth_states(expires_at);

-- Limpiar states expirados (ejecutar con cron)
DELETE FROM oauth_states WHERE expires_at < NOW();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE meli_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios solo ven sus propios datos
CREATE POLICY "Users can view own meli_connections"
ON meli_connections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own products"
ON products FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Los usuarios pueden insertar sus propios datos
CREATE POLICY "Users can insert own meli_connections"
ON meli_connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own products"
ON products FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Los usuarios pueden actualizar sus propios datos
CREATE POLICY "Users can update own meli_connections"
ON meli_connections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
ON products FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Los usuarios pueden eliminar sus propios datos
CREATE POLICY "Users can delete own meli_connections"
ON meli_connections FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
ON products FOR DELETE
USING (auth.uid() = user_id);
```

---

## 📦 Estructura del Proyecto

```
mlp-optimizador-meli/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Rutas de autenticación
│   │   ├── login/
│   │   │   └── page.tsx              # Página de login
│   │   ├── register/
│   │   │   └── page.tsx              # Página de registro
│   │   └── layout.tsx                # Layout sin navbar
│   │
│   ├── (dashboard)/                  # Rutas protegidas
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Dashboard principal
│   │   ├── products/
│   │   │   ├── page.tsx              # Lista de productos
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Detalle + análisis
│   │   ├── settings/
│   │   │   └── page.tsx              # Configuración
│   │   └── layout.tsx                # Layout con navbar
│   │
│   ├── api/                          # API Routes
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts          # Supabase auth callback
│   │   │
│   │   ├── meli/
│   │   │   ├── connect/
│   │   │   │   └── route.ts          # Iniciar OAuth MELI
│   │   │   ├── callback/
│   │   │   │   └── route.ts          # Callback OAuth MELI
│   │   │   ├── sync/
│   │   │   │   └── route.ts          # Sincronizar productos
│   │   │   └── disconnect/
│   │   │       └── route.ts          # Desconectar MELI
│   │   │
│   │   └── products/
│   │       ├── route.ts              # GET /api/products
│   │       └── [id]/
│   │           ├── route.ts          # GET /api/products/:id
│   │           └── analyze/
│   │               └── route.ts      # POST análisis
│   │
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Landing page
│
├── components/                       # Componentes React
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── AuthProvider.tsx
│   │
│   ├── dashboard/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── MeliConnectionCard.tsx
│   │
│   ├── products/
│   │   ├── ProductList.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductAnalysis.tsx
│   │   └── SyncButton.tsx
│   │
│   └── ui/                           # Shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       └── ...
│
├── lib/                              # Utilidades
│   ├── supabase/
│   │   ├── client.ts                 # Cliente Supabase (browser)
│   │   ├── server.ts                 # Cliente Supabase (server)
│   │   └── middleware.ts             # Middleware de auth
│   │
│   ├── meli/
│   │   ├── oauth.ts                  # OAuth MELI helpers
│   │   ├── api.ts                    # API MELI client
│   │   └── sync.ts                   # Sincronización
│   │
│   ├── encryption.ts                 # AES-256 para tokens
│   ├── analysis.ts                   # Lógica de análisis
│   └── utils.ts                      # Helpers generales
│
├── types/
│   ├── database.ts                   # Types de Supabase
│   ├── meli.ts                       # Types de MELI API
│   └── index.ts
│
├── middleware.ts                     # Middleware de Next.js
├── .env.local                        # Variables de entorno
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## ⚙️ Setup Inicial Paso a Paso

### 1. Crear Proyecto Next.js

```bash
# Crear proyecto
npx create-next-app@latest mlp-optimizador-meli

# Opciones recomendadas:
# ✓ TypeScript
# ✓ ESLint
# ✓ Tailwind CSS
# ✓ App Router
# ✓ import alias (@/*)

cd mlp-optimizador-meli
```

### 2. Instalar Dependencias

```bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# UI Components
npm install @radix-ui/react-dropdown-menu @radix-ui/react-slot
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react

# Utilidades
npm install axios
npm install date-fns
npm install zod  # Validación

# Desarrollo
npm install -D @types/node
```

### 3. Configurar Supabase

```bash
# 1. Crear cuenta en supabase.com
# 2. Crear nuevo proyecto
# 3. Copiar credenciales

# Crear .env.local
cat > .env.local << 'EOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

# MercadoLibre OAuth
MELI_CLIENT_ID=
MELI_CLIENT_SECRET=
NEXT_PUBLIC_MELI_REDIRECT_URI=https://tuapp.vercel.app/api/meli/callback

# Encriptación
ENCRYPTION_KEY=

# App
NEXT_PUBLIC_APP_URL=https://tuapp.vercel.app
EOF
```

### 4. Crear Schema en Supabase

```bash
# Ir a Supabase Dashboard → SQL Editor
# Copiar y ejecutar el schema completo de arriba
```

### 5. Configurar Supabase Client

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Server Component - can't set cookies
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Server Component - can't remove cookies
          }
        },
      },
    }
  )
}
```

### 6. Generar Clave de Encriptación

```bash
node scripts/generate-encryption-key.js
# Copiar resultado a .env.local
```

### 7. Registrar App en MELI

```bash
# Seguir: documentacion/GUIA_REGISTRO_MELI.md
# Copiar credenciales a .env.local
```

---

## 🔨 Implementación MVP (Fase por Fase)

### Fase 1A: Autenticación Usuarios (1 semana - 40h)

#### Día 1-2: Setup Supabase Auth (8h)

**Tareas:**
- [x] Configurar Supabase proyecto
- [x] Crear schema de usuarios
- [x] Configurar Email templates en Supabase
- [x] Implementar clientes Supabase (browser/server)

**Archivos:**

```typescript
// app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      router.push('/dashboard')
    }

    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      alert(error.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">
            Iniciar Sesión
          </h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Ingresar'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">O continuar con</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <span className="flex items-center justify-center">
            Google
          </span>
        </button>

        <p className="text-center text-sm">
          ¿No tienes cuenta?{' '}
          <a href="/register" className="text-blue-600 hover:underline">
            Regístrate
          </a>
        </p>
      </div>
    </div>
  )
}
```

```typescript
// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Proteger rutas /dashboard
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirigir a dashboard si ya está logueado
  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Tiempo estimado:** 8 horas

---

### Fase 1B: OAuth MercadoLibre (1.5 semanas - 60h)

#### Día 3-5: Implementar OAuth Flow (24h)

**Tareas:**
- [x] Crear endpoints /api/meli/connect y /api/meli/callback
- [x] Implementar generación y validación de state (CSRF)
- [x] Intercambio code → tokens
- [x] Encriptación de tokens
- [x] Guardar en DB

**Archivos clave:**

```typescript
// lib/meli/oauth.ts
import crypto from 'crypto'
import axios from 'axios'

const MELI_AUTH_URL = 'https://auth.mercadolibre.com.mx/authorization'
const MELI_TOKEN_URL = 'https://api.mercadolibre.com/oauth/token'

export interface MeliTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  user_id: number
}

export function generateAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.MELI_CLIENT_ID!,
    redirect_uri: process.env.NEXT_PUBLIC_MELI_REDIRECT_URI!,
    state,
  })

  return `${MELI_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string): Promise<MeliTokens> {
  const response = await axios.post(MELI_TOKEN_URL, {
    grant_type: 'authorization_code',
    client_id: process.env.MELI_CLIENT_ID!,
    client_secret: process.env.MELI_CLIENT_SECRET!,
    code,
    redirect_uri: process.env.NEXT_PUBLIC_MELI_REDIRECT_URI!,
  }, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })

  return response.data
}

export async function refreshAccessToken(refreshToken: string): Promise<MeliTokens> {
  const response = await axios.post(MELI_TOKEN_URL, {
    grant_type: 'refresh_token',
    client_id: process.env.MELI_CLIENT_ID!,
    client_secret: process.env.MELI_CLIENT_SECRET!,
    refresh_token: refreshToken,
  }, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })

  return response.data
}
```

```typescript
// lib/encryption.ts
import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
const IV_LENGTH = 16

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return `${iv.toString('hex')}:${encrypted}`
}

export function decrypt(text: string): string {
  const [ivHex, encryptedHex] = text.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv)

  let decrypted = decipher.update(encrypted)
  decrypted = Buffer.concat([decrypted, decipher.final()])

  return decrypted.toString('utf8')
}
```

```typescript
// app/api/meli/connect/route.ts
import { createClient } from '@/lib/supabase/server'
import { generateAuthUrl } from '@/lib/meli/oauth'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET(request: Request) {
  const supabase = await createClient()

  // Verificar que el usuario esté autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Generar state para CSRF protection
  const state = crypto.randomBytes(32).toString('hex')

  // Guardar state en DB asociado al usuario
  const { error: stateError } = await supabase
    .from('oauth_states')
    .insert({
      state,
      user_id: user.id,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutos
    })

  if (stateError) {
    console.error('Error saving oauth state:', stateError)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  // Generar URL de autorización de MELI
  const authUrl = generateAuthUrl(state)

  // Redirigir a MELI
  return NextResponse.redirect(authUrl)
}
```

```typescript
// app/api/meli/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens } from '@/lib/meli/oauth'
import { encrypt } from '@/lib/encryption'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/dashboard?error=missing_params', request.url)
    )
  }

  const supabase = await createClient()

  // Validar state (CSRF protection)
  const { data: oauthState, error: stateError } = await supabase
    .from('oauth_states')
    .select('user_id, expires_at')
    .eq('state', state)
    .single()

  if (stateError || !oauthState) {
    return NextResponse.redirect(
      new URL('/dashboard?error=invalid_state', request.url)
    )
  }

  // Verificar que no haya expirado
  if (new Date(oauthState.expires_at) < new Date()) {
    return NextResponse.redirect(
      new URL('/dashboard?error=state_expired', request.url)
    )
  }

  try {
    // Intercambiar code por tokens
    const tokens = await exchangeCodeForTokens(code)

    // Encriptar tokens
    const accessTokenEncrypted = encrypt(tokens.access_token)
    const refreshTokenEncrypted = encrypt(tokens.refresh_token)
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    // Guardar en DB
    const { error: insertError } = await supabase
      .from('meli_connections')
      .upsert({
        user_id: oauthState.user_id,
        meli_user_id: tokens.user_id,
        access_token_encrypted: accessTokenEncrypted,
        refresh_token_encrypted: refreshTokenEncrypted,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })

    if (insertError) {
      console.error('Error saving tokens:', insertError)
      throw insertError
    }

    // Limpiar state usado
    await supabase.from('oauth_states').delete().eq('state', state)

    // Redirigir al dashboard con éxito
    return NextResponse.redirect(
      new URL('/dashboard?meli_connected=true', request.url)
    )
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/dashboard?error=connection_failed', request.url)
    )
  }
}
```

**Tiempo estimado:** 24 horas

---

#### Día 6-8: Sincronización de Productos (24h)

**Tareas:**
- [x] Cliente API de MELI
- [x] Endpoint /api/meli/sync
- [x] Lógica de sincronización
- [x] Refresh automático de tokens

**Archivos:**

```typescript
// lib/meli/api.ts
import axios, { AxiosInstance } from 'axios'
import { decrypt } from '@/lib/encryption'

export class MeliApiClient {
  private client: AxiosInstance
  private accessToken: string

  constructor(encryptedAccessToken: string) {
    this.accessToken = decrypt(encryptedAccessToken)

    this.client = axios.create({
      baseURL: 'https://api.mercadolibre.com',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    })
  }

  async getUserItems(userId: number, limit: number = 50, offset: number = 0) {
    const response = await this.client.get(`/users/${userId}/items/search`, {
      params: {
        status: 'active',
        limit,
        offset,
        sort: 'sold_quantity_desc',
      },
    })
    return response.data
  }

  async getItem(itemId: string) {
    const response = await this.client.get(`/items/${itemId}`)
    return response.data
  }

  async getUser(userId: number) {
    const response = await this.client.get(`/users/${userId}`)
    return response.data
  }

  async getCategoryTrends(siteId: string, categoryId: string) {
    try {
      const response = await this.client.get(`/trends/${siteId}/${categoryId}`)
      return response.data
    } catch (error) {
      // Trends endpoint puede no estar disponible para todas las categorías
      console.warn(`Trends not available for category ${categoryId}`)
      return null
    }
  }
}
```

```typescript
// lib/meli/sync.ts
import { MeliApiClient } from './api'
import { createClient } from '@/lib/supabase/server'

export async function syncUserProducts(userId: string) {
  const supabase = await createClient()

  // Obtener conexión de MELI
  const { data: connection, error: connError } = await supabase
    .from('meli_connections')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (connError || !connection) {
    throw new Error('MELI connection not found')
  }

  // Crear cliente API
  const meliClient = new MeliApiClient(connection.access_token_encrypted)

  // Obtener datos del usuario de MELI
  const meliUser = await meliClient.getUser(connection.meli_user_id)

  // Actualizar nickname si cambió
  if (meliUser.nickname !== connection.meli_nickname) {
    await supabase
      .from('meli_connections')
      .update({ meli_nickname: meliUser.nickname })
      .eq('user_id', userId)
  }

  // Obtener items del usuario
  const itemsResult = await meliClient.getUserItems(connection.meli_user_id)
  const itemIds = itemsResult.results

  console.log(`Syncing ${itemIds.length} products for user ${userId}`)

  // Obtener detalles de cada item
  for (const itemId of itemIds) {
    try {
      const itemData = await meliClient.getItem(itemId)

      // Guardar/actualizar en DB
      await supabase.from('products').upsert({
        id: itemData.id,
        user_id: userId,
        title: itemData.title,
        description: itemData.description || '',
        price: itemData.price,
        original_price: itemData.original_price,
        currency_id: itemData.currency_id,
        sold_quantity: itemData.sold_quantity,
        available_quantity: itemData.available_quantity,
        status: itemData.status,
        category_id: itemData.category_id,
        listing_type_id: itemData.listing_type_id,
        permalink: itemData.permalink,
        thumbnail: itemData.thumbnail,
        raw_data: itemData,
        synced_at: new Date().toISOString(),
      })

      console.log(`✓ Synced product ${itemId}`)
    } catch (error) {
      console.error(`Error syncing product ${itemId}:`, error)
    }
  }

  // Actualizar last_sync_at
  await supabase
    .from('meli_connections')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('user_id', userId)

  console.log(`✅ Sync completed for user ${userId}`)
}
```

```typescript
// app/api/meli/sync/route.ts
import { createClient } from '@/lib/supabase/server'
import { syncUserProducts } from '@/lib/meli/sync'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await syncUserProducts(user.id)

    return NextResponse.json({
      success: true,
      message: 'Products synced successfully',
    })
  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    )
  }
}
```

**Tiempo estimado:** 24 horas

---

#### Día 9-10: Dashboard UI (12h)

**Tareas:**
- [x] Vista de productos
- [x] Botón conectar MELI
- [x] Estado de conexión
- [x] Botón sincronizar

**Archivos:**

```typescript
// app/(dashboard)/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MeliConnectionCard from '@/components/dashboard/MeliConnectionCard'
import ProductList from '@/components/products/ProductList'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verificar si tiene MELI conectado
  const { data: meliConnection } = await supabase
    .from('meli_connections')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Obtener productos
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', user.id)
    .order('sold_quantity', { ascending: false })

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <MeliConnectionCard connection={meliConnection} />

      {meliConnection && products && products.length > 0 ? (
        <ProductList products={products} />
      ) : (
        <div className="mt-8 text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            {!meliConnection
              ? 'Conecta tu cuenta de MercadoLibre para ver tus productos'
              : 'Sincronizando productos...'}
          </p>
        </div>
      )}
    </div>
  )
}
```

```typescript
// components/dashboard/MeliConnectionCard.tsx
'use client'

import { useState } from 'react'

interface Props {
  connection: any | null
}

export default function MeliConnectionCard({ connection }: Props) {
  const [syncing, setSyncing] = useState(false)

  const handleConnect = () => {
    window.location.href = '/api/meli/connect'
  }

  const handleSync = async () => {
    setSyncing(true)

    try {
      const response = await fetch('/api/meli/sync', {
        method: 'POST',
      })

      if (response.ok) {
        window.location.reload()
      } else {
        alert('Error al sincronizar')
      }
    } catch (error) {
      alert('Error al sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  if (!connection) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">
          Conecta tu cuenta de MercadoLibre
        </h2>
        <p className="text-gray-700 mb-4">
          Para analizar tus publicaciones, necesitas conectar tu cuenta de MercadoLibre.
        </p>
        <button
          onClick={handleConnect}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-4 rounded"
        >
          🔗 Conectar con MercadoLibre
        </button>
      </div>
    )
  }

  const lastSync = connection.last_sync_at
    ? new Date(connection.last_sync_at).toLocaleString()
    : 'Nunca'

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold mb-1">
            ✅ Conectado como @{connection.meli_nickname || 'usuario'}
          </h2>
          <p className="text-sm text-gray-600">
            Última sincronización: {lastSync}
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
        >
          {syncing ? '🔄 Sincronizando...' : '🔄 Sincronizar ahora'}
        </button>
      </div>
    </div>
  )
}
```

**Tiempo estimado:** 12 horas

---

### Resumen Fase 1: MVP Funcional

**Total:** 80 horas (2 semanas con Claude Code)

**Entregable:**
- ✅ Registro/Login con Supabase
- ✅ OAuth MELI funcionando
- ✅ Sincronización de productos
- ✅ Dashboard con lista de productos
- ✅ Deploy en Vercel (sin dominio)

**Costo:** $0

---

## 🚀 Deploy sin Dominio

### Opción 1: Vercel (Recomendada)

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Configurar variables de entorno en Vercel Dashboard
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
# MELI_CLIENT_ID
# MELI_CLIENT_SECRET
# NEXT_PUBLIC_MELI_REDIRECT_URI=https://tu-app.vercel.app/api/meli/callback
# ENCRYPTION_KEY
# NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app

# 5. Actualizar REDIRECT_URI en MELI Developers
# https://tu-app.vercel.app/api/meli/callback

# 6. Deploy producción
vercel --prod
```

**URL final:** `https://mlp-optimizador-meli.vercel.app`

---

## 📊 Comparativa de Esfuerzo

| Fase | Descripción | Manual | Con Claude Code | Ahorro |
|------|-------------|--------|-----------------|--------|
| **1A** | Auth Supabase | 16h | 8h | 50% |
| **1B** | OAuth MELI | 100h | 60h | 40% |
| **TOTAL MVP** | | 240h (6 sem) | 120h (3 sem) | 50% |

---

## 🎯 Próximos Pasos

1. ✅ Configurar Supabase proyecto
2. ✅ Registrar app en MELI
3. ✅ Generar clave de encriptación
4. ⏳ Implementar auth usuarios (Fase 1A)
5. ⏳ Implementar OAuth MELI (Fase 1B)
6. ⏳ Deploy a Vercel

---

**Última actualización:** Enero 2026
**Versión:** 2.0
**Siguiente:** Fase 2 - MLP (Webhooks + WebSockets + API)
