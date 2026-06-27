'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { OnboardingGuard } from '@/components/dashboard/onboarding-guard'
import { ToastProvider } from '@/lib/use-toast'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmailVerificationBanner } from '@/components/dashboard/email-verification-banner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ToastProvider>
      <div className="flex h-dvh overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto bg-primary">
          <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-primary/80 backdrop-blur-sm px-4 md:px-8 py-3 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="text-lg font-bold tracking-tight">Kvant</span>
          </div>
          <OnboardingGuard>
            <div className="mx-auto max-w-5xl px-4 md:px-8 py-4 md:py-8">
              <EmailVerificationBanner />
              <div className="mt-2">{children}</div>
            </div>
          </OnboardingGuard>
        </main>
      </div>
    </ToastProvider>
  )
}
