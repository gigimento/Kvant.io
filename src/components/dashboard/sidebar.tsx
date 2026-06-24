"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { FileText, Search, LayoutDashboard, CreditCard, Link2, LogOut, BarChart3, FileEdit, Calendar, Receipt, Presentation, Settings, X, ScanLine, Globe, Zap, Gift, TrendingUp, Users, Mail, SearchCode } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/reports", label: "Narrative Reports", icon: FileText },
  { href: "/dashboard/seo", label: "Brand Radar", icon: Search },
  { href: "/dashboard/competitive", label: "Competitive Dashboard", icon: BarChart3 },
  { href: "/dashboard/keyword-rankings", label: "Rank Tracker", icon: SearchCode },
  { href: "/dashboard/content-briefs", label: "Content Briefs", icon: FileEdit },
  { href: "/dashboard/content-calendar", label: "Content Calendar", icon: Calendar },
  { href: "/dashboard/invoices", label: "Invoices", icon: Receipt },
  { href: "/dashboard/proposals", label: "Proposals", icon: Presentation },
  { href: "/dashboard/analytics", label: "Analytics Hub", icon: TrendingUp },
  { href: "/dashboard/client-portal", label: "Client Portal", icon: Users },
  { href: "/dashboard/scheduled-reports", label: "Scheduled Reports", icon: Mail },
  { href: "/dashboard/citation-audit", label: "AI Citation Audit", icon: ScanLine },
  { href: "/dashboard/aeo", label: "AEO Foundations", icon: Globe },
  { href: "/dashboard/agentic", label: "Agentic Readiness", icon: Zap },
  { href: "/dashboard/referrals", label: "Referrals", icon: Gift },
  { href: "/dashboard/backlinks", label: "Backlinks", icon: Link2 },
  { href: "/dashboard/connections", label: "Connections", icon: Link2 },
  { href: "/dashboard/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState("")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email)
    })
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  function handleNav(href: string) {
    if (window.innerWidth < 768) onClose()
  }

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center justify-between gap-2 border-b border-border px-6">
        <Link href="/dashboard" onClick={() => handleNav("/dashboard")} className="text-lg font-bold tracking-tight">
          Kvant
        </Link>
        <button onClick={onClose} className="md:hidden text-muted-foreground hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => handleNav(item.href)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative",
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              {isActive && (
                <span className="absolute left-1 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-green-400 animate-glow-pulse" />
              )}
              <Icon className="h-4 w-4 ml-3" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-border p-4 space-y-2">
        {userEmail && (
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">
            {userEmail}
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile sidebar (overlay) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-primary/95 border-r border-border transform transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar (always visible) */}
      <aside className="hidden md:flex md:w-64 flex-col border-r border-border bg-primary/50">
        {sidebarContent}
      </aside>
    </>
  )
}
