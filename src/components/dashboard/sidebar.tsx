"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { FileText, Search, LayoutDashboard, CreditCard, Link2, LogOut, BarChart3, FileEdit, Palette, Calendar, Receipt, Presentation, Sun, Moon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useTheme } from "@/lib/use-theme"

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/reports",
    label: "Narrative Reports",
    icon: FileText,
  },
  {
    href: "/dashboard/seo",
    label: "Brand Radar",
    icon: Search,
  },
  {
    href: "/dashboard/competitive",
    label: "Competitive Dashboard",
    icon: BarChart3,
  },
  {
    href: "/dashboard/content-briefs",
    label: "Content Briefs",
    icon: FileEdit,
  },
  {
    href: "/dashboard/content-calendar",
    label: "Content Calendar",
    icon: Calendar,
  },
  {
    href: "/dashboard/invoices",
    label: "Invoices",
    icon: Receipt,
  },
  {
    href: "/dashboard/proposals",
    label: "Proposals",
    icon: Presentation,
  },
  {
    href: "/dashboard/connections",
    label: "Connections",
    icon: Link2,
  },
  {
    href: "/dashboard/subscriptions",
    label: "Subscriptions",
    icon: CreditCard,
  },
  {
    href: "/dashboard/settings/branding",
    label: "Branding",
    icon: Palette,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggle, mounted } = useTheme()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-primary/50">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          Kvant
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
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
        <button
          onClick={toggle}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
        >
          {!mounted ? (
            <div className="h-4 w-4" />
          ) : theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          {!mounted ? "" : theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
