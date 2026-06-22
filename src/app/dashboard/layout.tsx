'use client'

import { Sidebar } from '@/components/dashboard/sidebar'
import { OnboardingGuard } from '@/components/dashboard/onboarding-guard'
import { ToastProvider } from '@/lib/use-toast'
import { useTheme } from '@/lib/use-theme'

function ThemeInit() {
  useTheme()
  return null
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ToastProvider>
      <ThemeInit />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-primary">
          <OnboardingGuard>
            <div className="mx-auto max-w-5xl px-8 py-8">{children}</div>
          </OnboardingGuard>
        </main>
      </div>
    </ToastProvider>
  )
}
