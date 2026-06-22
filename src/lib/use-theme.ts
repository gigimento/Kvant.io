'use client'

export function useTheme() {
  return { theme: 'dark' as const, toggle: () => {}, mounted: true }
}
