import { Sidebar } from "@/components/dashboard/sidebar"
import { OnboardingGuard } from "@/components/dashboard/onboarding-guard"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-primary">
        <OnboardingGuard>
          <div className="mx-auto max-w-5xl px-8 py-8">{children}</div>
        </OnboardingGuard>
      </main>
    </div>
  )
}
