'use client'

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

export function useTheme() {
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const stored = localStorage.getItem('kvant-theme') as Theme | null
    const preferred = window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark'
    const initial = stored || preferred
    setTheme(initial)
    document.documentElement.classList.toggle('light', initial === 'light')
    document.documentElement.classList.toggle('dark', initial === 'dark')
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.classList.toggle('light', theme === 'light')
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('kvant-theme', theme)
    document.documentElement.style.colorScheme = theme
  }, [theme, mounted])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('kvant-theme')) {
        setTheme(e.matches ? 'light' : 'dark')
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const toggle = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))

  if (!mounted) {
    return { theme: 'dark' as Theme, toggle, mounted: false }
  }

  return { theme, toggle, mounted: true }
}
