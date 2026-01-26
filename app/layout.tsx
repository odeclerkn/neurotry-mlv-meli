import type { Metadata } from 'next'
import { Poppins, Montserrat } from 'next/font/google'
import './globals.css'
import { NavigationProgress } from '@/components/navigation-progress'

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
})

const montserrat = Montserrat({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Optimizador de publicaciones MELI',
  description: 'Optimiza tus publicaciones de MercadoLibre con IA',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${poppins.variable} ${montserrat.variable} font-sans antialiased`}>
        <NavigationProgress />
        {children}
      </body>
    </html>
  )
}
