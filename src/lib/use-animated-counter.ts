'use client'

import { useEffect, useRef, useState } from 'react'

interface UseAnimatedCounterOptions {
  end: number
  duration?: number
  threshold?: number
  rootMargin?: string
}

export function useAnimatedCounter({
  end,
  duration = 1500,
  threshold = 0.3,
  rootMargin = '0px',
}: UseAnimatedCounterOptions) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null!)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          const startTime = performance.now()

          function animate(now: number) {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.round(eased * end))
            if (progress < 1) {
              requestAnimationFrame(animate)
            }
          }

          requestAnimationFrame(animate)
          observer.unobserve(el)
        }
      },
      { threshold, rootMargin },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [end, duration, threshold, rootMargin, hasAnimated])

  return { count, ref }
}
