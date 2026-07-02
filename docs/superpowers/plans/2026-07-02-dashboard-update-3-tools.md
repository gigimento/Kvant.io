# Dashboard Update to 3 Core Tools

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the dashboard home page to show only the 3 pivot tools (Brand Radar, GEO Briefs, PDF Audit) with correct stats, actions, and activity.

**Architecture:** Modify the stats API route to fetch data from the 3 core tables, then update the dashboard page to display Brand Scans, GEO Briefs, PDF Audits, and Active Subscriptions with appropriate quick actions and recent activity.

**Tech Stack:** Next.js App Router, Supabase, React, Tailwind CSS

---

### Task 1: Update Stats API Route

**Files:**
- Modify: `src/app/api/dashboard/stats/route.ts:12-50`

- [ ] **Step 1: Update the stats API to return data for the 3 core tools**

Replace the existing `Promise.all` and response building with code that queries `brand_monitors`, `content_briefs`, and `subscriptions` tables. Keep `reports` data for backward compatibility but don't emphasize it. Add `geoBriefCount`, `pdfAuditCount` (use `content_briefs` count for now as PDF audits may not have a separate table yet), and `subscriptionCount`.

```typescript
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [monitorsRes, briefsRes, subscriptionsRes] = await Promise.all([
      supabase.from("brand_monitors").select("id, created_at", { count: "exact" }).eq("user_id", user.id),
      supabase.from("content_briefs").select("id, created_at", { count: "exact" }).eq("user_id", user.id),
      supabase.from("subscriptions").select("id", { count: "exact" }).eq("user_id", user.id).eq("status", "active"),
    ])

    const recentScans = (monitorsRes.data || []).slice(-5).reverse()

    return NextResponse.json({
      brandScanCount: monitorsRes.count || 0,
      geoBriefCount: briefsRes.count || 0,
      pdfAuditCount: briefsRes.count || 0,
      subscriptionCount: subscriptionsRes.count || 0,
      recentScans,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify build passes**

Run: `cd "C:\Users\Igor\Documents\i4ss\agency-tools"; npm run build 2>&1 | Select-Object -Last 10`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit API changes**

```bash
cd "C:\Users\Igor\Documents\i4ss\agency-tools"
git add src/app/api/dashboard/stats/route.ts
git commit -m "feat: update dashboard stats API for 3 core tools"
```

---

### Task 2: Update Dashboard Page

**Files:**
- Modify: `src/app/dashboard/page.tsx:12-23` (DashboardStats interface)
- Modify: `src/app/dashboard/page.tsx:119-203` (stats cards, quick actions, recent activity)

- [ ] **Step 1: Update the DashboardStats interface**

Replace the interface to match the new API response:

```typescript
interface DashboardStats {
  brandScanCount: number
  geoBriefCount: number
  pdfAuditCount: number
  subscriptionCount: number
  recentScans: { id: string; created_at: string }[]
}
```

- [ ] **Step 2: Update the stats cards section**

Replace the 4 `AnimatedStatCard` components (lines 119-149) with cards for Brand Scans, GEO Briefs, PDF Audits, and Active Subscriptions:

```tsx
<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
  <AnimatedStatCard
    title="Brand Scans"
    icon={Search}
    end={stats?.brandScanCount || 0}
    href="/dashboard/brand-radar"
  />
  <AnimatedStatCard
    title="GEO Briefs"
    icon={Globe}
    end={stats?.geoBriefCount || 0}
    href="/dashboard/geo-briefs"
  />
  <AnimatedStatCard
    title="PDF Audits"
    icon={FileText}
    end={stats?.pdfAuditCount || 0}
    href="/dashboard/pdf-audit"
  />
  <AnimatedStatCard
    title="Active Subscriptions"
    icon={DollarSign}
    end={stats?.subscriptionCount || 0}
    href="/dashboard/subscriptions"
  />
</div>
```

- [ ] **Step 3: Update the Recent Activity section**

Replace the "Recent Reports" card (lines 151-181) with "Recent Brand Scans":

```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-sm font-medium text-muted-foreground">Recent Brand Scans</CardTitle>
  </CardHeader>
  <CardContent>
    {stats && stats.brandScanCount > 0 ? (
      <div className="space-y-0">
        {(stats.recentScans || []).map((s, i) => (
          <div key={s.id} className="reveal flex items-center justify-between border-b border-border py-3 last:border-0"
            style={{ transitionDelay: `${i * 60}ms` }}>
            <Link href={`/dashboard/brand-radar/${s.id}`} className="text-sm font-medium hover:text-accent transition-colors">
              Brand scan completed
            </Link>
            <span className="text-xs text-muted-foreground">
              {new Date(s.created_at).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-12">
        <Search className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No brand scans yet</p>
        <Link href="/dashboard/brand-radar/new" className="mt-3 inline-block text-sm text-accent hover:underline">
          Start your first scan
        </Link>
      </div>
    )}
  </CardContent>
</Card>
```

- [ ] **Step 4: Update the Quick Actions section**

Replace the 3 quick action links (lines 183-201) with actions for the 3 core tools:

```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-sm font-medium text-muted-foreground">Quick Actions</CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    <Link href="/dashboard/brand-radar/new" className="flex items-center gap-3 rounded-lg border border-white/5 p-3 hover:bg-white/[0.03] transition-colors">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10"><Search className="h-4 w-4 text-accent" /></div>
      <div><p className="text-sm font-medium">New Brand Scan</p><p className="text-xs text-muted-foreground">Scan LLMs for brand mentions</p></div>
    </Link>
    <Link href="/dashboard/geo-briefs/new" className="flex items-center gap-3 rounded-lg border border-white/5 p-3 hover:bg-white/[0.03] transition-colors">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10"><Globe className="h-4 w-4 text-accent" /></div>
      <div><p className="text-sm font-medium">Generate GEO Brief</p><p className="text-xs text-muted-foreground">Create AI visibility action plan</p></div>
    </Link>
    <Link href="/dashboard/pdf-audit/new" className="flex items-center gap-3 rounded-lg border border-white/5 p-3 hover:bg-white/[0.03] transition-colors">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10"><FileText className="h-4 w-4 text-accent" /></div>
      <div><p className="text-sm font-medium">Create PDF Audit</p><p className="text-xs text-muted-foreground">Generate client-ready audit report</p></div>
    </Link>
  </CardContent>
</Card>
```

- [ ] **Step 5: Update imports**

Add `Globe` to the lucide-react import (line 8). Remove unused `FileText` import if not needed (it's used for PDF Audits, so keep it). Remove `TrendingUp` if unused.

Current import:
```typescript
import { FileText, Search, TrendingUp, ArrowUp, ArrowDown, DollarSign, PenSquare } from "lucide-react"
```

Updated import:
```typescript
import { FileText, Search, ArrowUp, ArrowDown, DollarSign, Globe } from "lucide-react"
```

- [ ] **Step 6: Verify build passes**

Run: `cd "C:\Users\Igor\Documents\i4ss\agency-tools"; npm run build 2>&1 | Select-Object -Last 10`
Expected: Build succeeds with no errors.

- [ ] **Step 7: Commit dashboard changes**

```bash
cd "C:\Users\Igor\Documents\i4ss\agency-tools"
git add src/app/dashboard/page.tsx
git commit -m "feat: update dashboard to show 3 core tools"
```

---

### Task 3: Final Verification

- [ ] **Step 1: Run full build**

Run: `cd "C:\Users\Igor\Documents\i4ss\agency-tools"; npm run build 2>&1 | Select-Object -Last 15`
Expected: Build passes, 0 errors.

- [ ] **Step 2: Verify no TypeScript errors**

Run: `cd "C:\Users\Igor\Documents\i4ss\agency-tools"; npx tsc --noEmit 2>&1 | Select-Object -Last 10`
Expected: No type errors.

---

**Plan complete.** Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
