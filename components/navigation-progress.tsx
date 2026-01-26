'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setLoading(false)
    setProgress(0)
  }, [pathname, searchParams])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')

      if (link && link.href && link.href.startsWith(window.location.origin)) {
        const url = new URL(link.href)
        if (url.pathname !== pathname) {
          setLoading(true)
          setProgress(10)

          // Simular progreso
          let currentProgress = 10
          interval = setInterval(() => {
            currentProgress += Math.random() * 10
            if (currentProgress > 90) {
              currentProgress = 90
              if (interval) clearInterval(interval)
            }
            setProgress(currentProgress)
          }, 300)
        }
      }
    }

    document.addEventListener('click', handleClick, true)

    return () => {
      document.removeEventListener('click', handleClick, true)
      if (interval) clearInterval(interval)
    }
  }, [pathname])

  if (!loading) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${progress}%`,
        height: '3px',
        backgroundColor: '#3B82F6',
        boxShadow: '0 0 10px #3B82F6',
        transition: 'width 0.3s ease-out',
        zIndex: 999999,
      }}
    />
  )
}
