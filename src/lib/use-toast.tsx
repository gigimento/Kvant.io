'use client'

import { createContext, useCallback, useContext, useState } from 'react'

type ToastVariant = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (message: string, variant?: ToastVariant) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = Math.random().toString(36).slice(2, 9)
      setToasts((prev) => [...prev, { id, message, variant }])
      setTimeout(() => removeToast(id), 4000)
    },
    [removeToast],
  )

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 sm:bottom-6 left-4 sm:left-auto sm:right-6 z-50 flex flex-col gap-3 pointer-events-none w-[calc(100vw-2rem)] sm:w-auto">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-green-500/40 bg-green-500/10',
  error: 'border-red-500/40 bg-red-500/10',
  info: 'border-blue-500/40 bg-blue-500/10',
  warning: 'border-yellow-500/40 bg-yellow-500/10',
}

const variantProgress: Record<ToastVariant, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  warning: 'bg-yellow-500',
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast
  onDismiss: () => void
}) {
  return (
    <div
      className={`animate-slide-in-right pointer-events-auto flex w-full sm:min-w-[280px] sm:max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-xl ${variantStyles[toast.variant]}`}
      role="alert"
    >
      <div className="flex-1">{toast.message}</div>
      <button
        onClick={onDismiss}
        className="mt-0.5 text-white/50 hover:text-white transition-colors"
      >
        ✕
      </button>
      <span
        className={`animate-toast-progress absolute bottom-0 left-0 h-0.5 rounded-full ${variantProgress[toast.variant]}`}
      />
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
