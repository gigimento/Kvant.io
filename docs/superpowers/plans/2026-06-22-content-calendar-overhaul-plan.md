# Content Calendar Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform basic content calendar into a full content planning hub with Kanban, multi-platform, AI caption generation, approval workflow, and user assignments.

**Architecture:** Extend existing `content_calendar` table with new columns (platform, content_type, scheduled_time, assigned_to, media_urls, ai_caption, evergreen_config), add `calendar_comments` table. Existing calendar API routes are extended; new routes handle AI fill, bulk scheduling, comments, and user listing. UI gets a tab switcher (Calendar / Kanban), entry form modal, and AI caption modal.

**Tech Stack:** Next.js 16 App Router, Supabase (PostgreSQL + RLS + Auth), Tailwind CSS v4, Recharts (charts used elsewhere), react-beautiful-dnd or @hello-pangea/dnd for Kanban drag-and-drop.

---

### Task 1: Database migration (016)

**Files:**
- Create: `supabase/migrations/016_content_calendar_overhaul.sql`

- [ ] **Write migration SQL**

File: `supabase/migrations/016_content_calendar_overhaul.sql`
```sql
-- 016: Content Calendar Overhaul — new columns and tables

-- Extend content_calendar
ALTER TABLE content_calendar
  ADD COLUMN IF NOT EXISTS platform TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS content_type TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_time TIME,
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_caption TEXT,
  ADD COLUMN IF NOT EXISTS evergreen_config JSONB;

-- Update status CHECK constraint
ALTER TABLE content_calendar DROP CONSTRAINT IF EXISTS content_calendar_status_check;
ALTER TABLE content_calendar ADD CONSTRAINT content_calendar_status_check
  CHECK (status IN ('draft', 'review', 'approved', 'scheduled', 'published'));

-- New indexes
CREATE INDEX IF NOT EXISTS idx_calendar_status ON content_calendar(user_id, status);
CREATE INDEX IF NOT EXISTS idx_calendar_assigned ON content_calendar(user_id, assigned_to);

-- Comments table
CREATE TABLE IF NOT EXISTS calendar_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES content_calendar(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE calendar_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read comments on their entries"
  ON calendar_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM content_calendar
      WHERE content_calendar.id = calendar_comments.entry_id
      AND content_calendar.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM content_calendar
      WHERE content_calendar.id = calendar_comments.entry_id
      AND content_calendar.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Users can insert own comments"
  ON calendar_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON calendar_comments FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_calendar_comments_entry ON calendar_comments(entry_id);
```

- [ ] **Commit**

```bash
git add supabase/migrations/016_content_calendar_overhaul.sql
git commit -m "feat: migration 016 — calendar overhaul columns + comments table"
```

---

### Task 2: Extend calendar API routes — list + create

**Files:**
- Modify: `src/app/api/content-calendar/route.ts`

- [ ] **Update GET handler — add status/platform/assigned_to filters**

Current GET extracts `month` and `year`. Add `status`, `platform`, `assigned_to` query params:

```typescript
// After extracting month/year, add:
const status = request.nextUrl.searchParams.get("status") // comma-separated
const platform = request.nextUrl.searchParams.get("platform") // comma-separated
const assignedTo = request.nextUrl.searchParams.get("assigned_to")

// Build query
let query = supabase
  .from("content_calendar")
  .select("*")
  .eq("user_id", user.id)
  .gte("scheduled_date", startOfMonth)
  .lte("scheduled_date", endOfMonth)
  .order("scheduled_date", { ascending: true })

if (status) {
  const statuses = status.split(",")
  query = query.in("status", statuses)
}
if (platform) {
  const platforms = platform.split(",")
  query = query.contains("platform", platforms) // contains = array overlap
}
if (assignedTo) {
  query = query.eq("assigned_to", assignedTo)
}
```

- [ ] **Update POST handler — add new fields**

Current POST accepts `{ title, scheduled_date, content_brief_id, notes, status }`. Add:

```typescript
const { title, scheduled_date, platform, content_type, scheduled_time, assigned_to, media_urls, ai_caption, evergreen_config } = await request.json()

// In insert, map:
const { data, error } = await supabase.from("content_calendar").insert({
  user_id: user.id,
  title,
  scheduled_date,
  platform: platform || [],
  content_type: content_type || null,
  scheduled_time: scheduled_time || null,
  assigned_to: assigned_to || null,
  media_urls: media_urls || [],
  ai_caption: ai_caption || null,
  evergreen_config: evergreen_config || null,
  status: status || "draft",
  content_brief_id: content_brief_id || null,
  notes: notes || null,
}).select().single()
```

- [ ] **Commit**

```bash
git add src/app/api/content-calendar/route.ts
git commit -m "feat: extend calendar API with filters + new fields"
```

---

### Task 3: Extend calendar API route — PATCH/DELETE by ID

**Files:**
- Modify: `src/app/api/content-calendar/[id]/route.ts`

- [ ] **Update PATCH handler — add new fields to whitelist**

```typescript
// Current allowed fields: title, scheduled_date, status, notes, content_brief_id
// Add: platform, content_type, scheduled_time, assigned_to, media_urls, ai_caption, evergreen_config

const allowedFields = [
  "title", "scheduled_date", "status", "notes", "content_brief_id",
  "platform", "content_type", "scheduled_time", "assigned_to",
  "media_urls", "ai_caption", "evergreen_config",
]
```

- [ ] **Commit**

```bash
git add src/app/api/content-calendar/[id]/route.ts
git commit -m "feat: extend calendar PATCH with new fields"
```

---

### Task 4: AI fill endpoint

**Files:**
- Create: `src/app/api/content-calendar/ai-fill/route.ts`

- [ ] **Create AI fill route**

```typescript
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkServerAccess } from "@/lib/subscription-guard"
import { askLLMWithSystem } from "@/lib/llm"

const SYSTEM_PROMPT = `You are a social media content strategist. Given a content brief, platform, and content type, generate engaging post content. Return JSON only: { "caption": "...", "hashtags": ["...", "..."], "suggestions": ["...", "..."] }. Caption should be platform-appropriate length.`

export async function POST(request: Request) {
  try {
    const { brief_id, platform, content_type } = await request.json()
    if (!brief_id || !platform) {
      return NextResponse.json({ error: "brief_id and platform required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const access = await checkServerAccess("content-calendar")
    if (!access.allowed) return NextResponse.json({ error: "Subscription required" }, { status: 402 })

    // Fetch brief
    const { data: brief } = await supabase
      .from("content_briefs")
      .select("*")
      .eq("id", brief_id)
      .eq("user_id", user.id)
      .single()
    if (!brief) return NextResponse.json({ error: "Brief not found" }, { status: 404 })

    const userPrompt = `Platform: ${platform}\nContent type: ${content_type || "social_post"}\nBrief title: ${brief.title}\nOutline: ${JSON.stringify(brief.outline)}\nKey points: ${JSON.stringify(brief.key_points)}\nTone: ${brief.tone_and_style || "professional"}\n\nGenerate a caption and hashtags.`

    const result = await askLLMWithSystem(SYSTEM_PROMPT, userPrompt, "fast")
    let parsed
    try {
      parsed = JSON.parse(result)
    } catch {
      parsed = { caption: result, hashtags: [], suggestions: [] }
    }

    return NextResponse.json({ caption: parsed.caption, hashtags: parsed.hashtags || [], suggestions: parsed.suggestions || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

- [ ] **Commit**

```bash
git add src/app/api/content-calendar/ai-fill/route.ts
git commit -m "feat: AI caption generation endpoint for content calendar"
```

---

### Task 5: Bulk scheduling endpoint

**Files:**
- Create: `src/app/api/content-calendar/bulk/route.ts`

- [ ] **Create bulk scheduling route**

```typescript
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkServerAccess } from "@/lib/subscription-guard"

export async function POST(request: Request) {
  try {
    const { entries } = await request.json()
    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: "entries array required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const access = await checkServerAccess("content-calendar")
    if (!access.allowed) return NextResponse.json({ error: "Subscription required" }, { status: 402 })

    const rows = entries.map((e: any) => ({
      user_id: user.id,
      title: e.title,
      scheduled_date: e.scheduled_date,
      platform: e.platform || [],
      content_type: e.content_type || null,
      scheduled_time: e.scheduled_time || null,
      assigned_to: e.assigned_to || null,
      media_urls: e.media_urls || [],
      ai_caption: e.ai_caption || null,
      status: e.status || "draft",
    }))

    const { data, error } = await supabase.from("content_calendar").insert(rows).select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, entries: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

- [ ] **Commit**

```bash
git add src/app/api/content-calendar/bulk/route.ts
git commit -m "feat: bulk scheduling endpoint"
```

---

### Task 6: Comments API endpoint

**Files:**
- Create: `src/app/api/content-calendar/[id]/comments/route.ts`

- [ ] **Create comments route**

```typescript
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkServerAccess } from "@/lib/subscription-guard"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data } = await supabase
      .from("calendar_comments")
      .select("*, auth_users:user_id(email)")
      .eq("entry_id", id)
      .order("created_at", { ascending: true })
    return NextResponse.json({ comments: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { comment } = await request.json()
    if (!comment) return NextResponse.json({ error: "comment required" }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase.from("calendar_comments").insert({
      entry_id: id,
      user_id: user.id,
      comment,
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ comment: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await supabase.from("calendar_comments").delete().eq("id", id).eq("user_id", user.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

- [ ] **Commit**

```bash
git add src/app/api/content-calendar/[id]/comments/route.ts
git commit -m "feat: calendar comments API"
```

---

### Task 7: Users API endpoint

**Files:**
- Create: `src/app/api/users/route.ts`

- [ ] **Create users listing route**

```typescript
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // List users from auth.users via profiles table (users who have profiles)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .not("full_name", "is", null)
      .limit(50)

    return NextResponse.json({ users: profiles || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

- [ ] **Commit**

```bash
git add src/app/api/users/route.ts
git commit -m "feat: users API for assignment dropdown"
```

---

### Task 8: Entry Form component

**Files:**
- Create: `src/components/calendar/entry-form.tsx`

- [ ] **Create EntryForm component**

This is the modal/panel for adding/editing calendar entries. It contains:
- Title input (required)
- Platform: multi-select checkboxes with colored icons (Instagram pink `#E1306C`, TikTok cyan `#00F2EA`, Facebook blue `#1877F2`, YouTube red `#FF0000`)
- Content type dropdown: blog, social_post, video, carousel
- Date input + Time input
- Assigned to: dropdown (fetches from GET /api/users)
- Status select: draft, review, approved, scheduled, published
- Media URLs: list of text inputs with Add/Remove buttons
- AI Caption: textarea (editable)
- Evergreen: toggle switch + interval days (shown when enabled)
- Save/Cancel buttons

Props: `entry?: CalendarEntry` (edit mode), `prefill?: { title, content_brief_id }`, `onSave: () => void`, `onClose: () => void`

```typescript
"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { X, Plus, Trash2 } from "lucide-react"

const PLATFORMS = [
  { id: "instagram", label: "Instagram", color: "#E1306C" },
  { id: "tiktok", label: "TikTok", color: "#00F2EA" },
  { id: "facebook", label: "Facebook", color: "#1877F2" },
  { id: "youtube", label: "YouTube", color: "#FF0000" },
]

const CONTENT_TYPES = [
  { id: "blog", label: "Blog" },
  { id: "social_post", label: "Social Post" },
  { id: "video", label: "Video" },
  { id: "carousel", label: "Carousel" },
]

const STATUSES = ["draft", "review", "approved", "scheduled", "published"]

interface CalendarEntry {
  id?: string
  title: string
  platform: string[]
  content_type: string
  scheduled_date: string
  scheduled_time: string
  assigned_to: string | null
  status: string
  media_urls: string[]
  ai_caption: string
  notes: string
  evergreen_config: { enabled?: boolean; interval_days?: number } | null
}

interface Props {
  entry?: Partial<CalendarEntry> & { id?: string }
  prefill?: { title?: string; content_brief_id?: string }
  onSave: () => void
  onClose: () => void
}

export function EntryForm({ entry, prefill, onSave, onClose }: Props) {
  const [form, setForm] = useState<CalendarEntry>({
    title: entry?.title || prefill?.title || "",
    platform: entry?.platform || [],
    content_type: entry?.content_type || "social_post",
    scheduled_date: entry?.scheduled_date || "",
    scheduled_time: entry?.scheduled_time || "",
    assigned_to: entry?.assigned_to || null,
    status: entry?.status || "draft",
    media_urls: entry?.media_urls || [],
    ai_caption: entry?.ai_caption || "",
    notes: entry?.notes || "",
    evergreen_config: entry?.evergreen_config || null,
  })
  const [users, setUsers] = useState<{ id: string; full_name: string | null }[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/users").then(r => r.json()).then(d => setUsers(d.users || []))
  }, [])

  function togglePlatform(id: string) {
    setForm(f => ({
      ...f,
      platform: f.platform.includes(id)
        ? f.platform.filter(p => p !== id)
        : [...f.platform, id],
    }))
  }

  function addMediaUrl() {
    setForm(f => ({ ...f, media_urls: [...f.media_urls, ""] }))
  }

  function updateMediaUrl(i: number, val: string) {
    setForm(f => {
      const urls = [...f.media_urls]
      urls[i] = val
      return { ...f, media_urls: urls }
    })
  }

  function removeMediaUrl(i: number) {
    setForm(f => ({ ...f, media_urls: f.media_urls.filter((_, idx) => idx !== i) }))
  }

  async function handleSave() {
    if (!form.title.trim() || form.platform.length === 0) return
    setSaving(true)
    const supabase = createClient()
    const body = { ...form, scheduled_date: form.scheduled_date || new Date().toISOString().split("T")[0] }

    if (entry?.id) {
      await supabase.from("content_calendar").update(body).eq("id", entry.id)
    } else {
      await supabase.from("content_calendar").insert(body)
    }
    setSaving(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-border bg-primary p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">{entry?.id ? "Edit" : "Add"} Entry</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        {/* Title */}
        <label className="block text-sm font-medium mb-1 text-muted-foreground">Title *</label>
        <input className="w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm mb-4" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />

        {/* Platform */}
        <label className="block text-sm font-medium mb-2 text-muted-foreground">Platforms *</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {PLATFORMS.map(p => (
            <button key={p.id} onClick={() => togglePlatform(p.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                form.platform.includes(p.id) ? "text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
              style={form.platform.includes(p.id) ? { backgroundColor: p.color } : {}}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Content Type */}
        <label className="block text-sm font-medium mb-1 text-muted-foreground">Content Type</label>
        <select className="w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm mb-4" value={form.content_type} onChange={e => setForm(f => ({ ...f, content_type: e.target.value }))}>
          {CONTENT_TYPES.map(ct => <option key={ct.id} value={ct.id}>{ct.label}</option>)}
        </select>

        {/* Date + Time */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-muted-foreground">Date</label>
            <input type="date" className="w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-muted-foreground">Time</label>
            <input type="time" className="w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm" value={form.scheduled_time} onChange={e => setForm(f => ({ ...f, scheduled_time: e.target.value }))} />
          </div>
        </div>

        {/* Assigned To + Status */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-muted-foreground">Assigned To</label>
            <select className="w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm" value={form.assigned_to || ""} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value || null }))}>
              <option value="">Unassigned</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.id.slice(0, 8)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-muted-foreground">Status</label>
            <select className="w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>

        {/* AI Caption */}
        <label className="block text-sm font-medium mb-1 text-muted-foreground">Caption</label>
        <textarea className="w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm mb-4 min-h-[100px]" value={form.ai_caption} onChange={e => setForm(f => ({ ...f, ai_caption: e.target.value }))} />

        {/* Media URLs */}
        <label className="block text-sm font-medium mb-1 text-muted-foreground">Media URLs</label>
        <div className="space-y-2 mb-4">
          {form.media_urls.map((url, i) => (
            <div key={i} className="flex gap-2">
              <input className="flex-1 rounded-lg border border-border bg-white/5 px-3 py-2 text-sm" value={url} onChange={e => updateMediaUrl(i, e.target.value)} placeholder="https://..." />
              <button onClick={() => removeMediaUrl(i)} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <button onClick={addMediaUrl} className="flex items-center gap-1 text-xs text-accent hover:text-accent/80"><Plus className="h-3 w-3" /> Add URL</button>
        </div>

        {/* Evergreen */}
        <label className="flex items-center gap-2 mb-4">
          <input type="checkbox" className="rounded border-border" checked={!!form.evergreen_config?.enabled}
            onChange={e => setForm(f => ({ ...f, evergreen_config: e.target.checked ? { enabled: true, interval_days: 7 } : null }))} />
          <span className="text-sm text-muted-foreground">Evergreen (auto-repost)</span>
        </label>
        {form.evergreen_config?.enabled && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-muted-foreground">Interval (days)</label>
            <input type="number" className="w-24 rounded-lg border border-border bg-white/5 px-3 py-2 text-sm" min={1} value={form.evergreen_config.interval_days || 7}
              onChange={e => setForm(f => ({ ...f, evergreen_config: { ...f.evergreen_config!, interval_days: parseInt(e.target.value) || 7 } }))} />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.title.trim() || form.platform.length === 0}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50 transition-colors">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/calendar/entry-form.tsx
git commit -m "feat: entry form modal component"
```

---

### Task 9: Kanban view + card components

**Files:**
- Create: `src/components/calendar/kanban-card.tsx`
- Create: `src/components/calendar/kanban-view.tsx`

- [ ] **Create KanbanCard component**

```typescript
"use client"

import { CalendarDays, User } from "lucide-react"

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E1306C",
  tiktok: "#00F2EA",
  facebook: "#1877F2",
  youtube: "#FF0000",
}

interface KanbanCardProps {
  entry: any
  onClick: () => void
}

export function KanbanCard({ entry, onClick }: KanbanCardProps) {
  const statusColors: Record<string, string> = {
    draft: "bg-yellow-500/20 border-yellow-500/30",
    review: "bg-orange-500/20 border-orange-500/30",
    approved: "bg-blue-500/20 border-blue-500/30",
    scheduled: "bg-purple-500/20 border-purple-500/30",
    published: "bg-green-500/20 border-green-500/30",
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border p-3 cursor-pointer transition-colors hover:brightness-110 ${statusColors[entry.status] || "bg-white/5 border-border"}`}
    >
      <div className="flex items-center gap-1.5 mb-2">
        {(entry.platform || []).map((p: string) => (
          <span key={p} className="h-2 w-2 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[p] || "#666" }} />
        ))}
      </div>
      <p className="text-sm font-medium mb-2 line-clamp-2">{entry.title}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{entry.scheduled_date}</span>
        {entry.assigned_to && <span><User className="h-3 w-3" /></span>}
      </div>
    </div>
  )
}
```

- [ ] **Create KanbanView component**

```typescript
"use client"

import { useState } from "react"
import { KanbanCard } from "./kanban-card"

const COLUMNS = [
  { key: "draft", label: "Draft" },
  { key: "review", label: "Review" },
  { key: "approved", label: "Approved" },
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Published" },
]

interface KanbanViewProps {
  entries: any[]
  onEntryClick: (entry: any) => void
  onStatusChange: (entryId: string, newStatus: string) => void
}

export function KanbanView({ entries, onEntryClick, onStatusChange }: KanbanViewProps) {
  const [dragId, setDragId] = useState<string | null>(null)

  function handleDragStart(e: React.DragEvent, entryId: string) {
    setDragId(entryId)
    e.dataTransfer.effectAllowed = "move"
  }

  function handleDrop(e: React.DragEvent, status: string) {
    e.preventDefault()
    if (dragId) {
      onStatusChange(dragId, status)
      setDragId(null)
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  return (
    <div className="grid grid-cols-5 gap-4 min-h-[60vh]">
      {COLUMNS.map(col => {
        const colEntries = entries.filter(e => e.status === col.key)
        return (
          <div
            key={col.key}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, col.key)}
            className="rounded-xl border border-border bg-card p-3"
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-semibold">{col.label}</h3>
              <span className="text-xs text-muted-foreground bg-white/5 rounded-full px-2 py-0.5">{colEntries.length}</span>
            </div>
            <div className="space-y-2">
              {colEntries.map(entry => (
                <div key={entry.id} draggable onDragStart={e => handleDragStart(e, entry.id)}>
                  <KanbanCard entry={entry} onClick={() => onEntryClick(entry)} />
                </div>
              ))}
              {colEntries.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No entries</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/calendar/kanban-card.tsx src/components/calendar/kanban-view.tsx
git commit -m "feat: Kanban view with drag-and-drop between statuses"
```

---

### Task 10: Comments panel component

**Files:**
- Create: `src/components/calendar/comments-panel.tsx`

- [ ] **Create CommentsPanel component**

```typescript
"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Send } from "lucide-react"

interface Comment {
  id: string
  entry_id: string
  user_id: string
  comment: string
  created_at: string
}

interface Props {
  entryId: string
}

export function CommentsPanel({ entryId }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/content-calendar/${entryId}/comments`)
      .then(r => r.json())
      .then(d => { setComments(d.comments || []); setLoading(false) })
  }, [entryId])

  async function addComment() {
    if (!text.trim()) return
    const res = await fetch(`/api/content-calendar/${entryId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: text }),
    })
    const data = await res.json()
    if (data.comment) {
      setComments(prev => [...prev, data.comment])
      setText("")
    }
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
        <MessageSquare className="h-4 w-4" /> Comments ({comments.length})
      </h4>
      <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
        {comments.map(c => (
          <div key={c.id} className="rounded-lg bg-white/5 px-3 py-2 text-sm">
            <p className="text-xs text-muted-foreground mb-1">{c.user_id.slice(0, 8)} · {new Date(c.created_at).toLocaleDateString()}</p>
            <p>{c.comment}</p>
          </div>
        ))}
        {!loading && comments.length === 0 && <p className="text-xs text-muted-foreground">No comments yet</p>}
      </div>
      <div className="flex gap-2">
        <input className="flex-1 rounded-lg border border-border bg-white/5 px-3 py-2 text-sm" value={text} onChange={e => setText(e.target.value)}
          placeholder="Add a comment..." onKeyDown={e => e.key === "Enter" && addComment()} />
        <button onClick={addComment} className="rounded-lg bg-accent p-2 text-white hover:bg-accent/90"><Send className="h-4 w-4" /></button>
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/calendar/comments-panel.tsx
git commit -m "feat: comments panel component"
```

---

### Task 11: AI fill modal component

**Files:**
- Create: `src/components/calendar/ai-fill-modal.tsx`

- [ ] **Create AI fill modal**

```typescript
"use client"

import { useState } from "react"
import { Sparkles, Loader2, X } from "lucide-react"

interface Props {
  briefId: string
  onSchedule: (caption: string) => void
  onClose: () => void
}

export function AiFillModal({ briefId, onSchedule, onClose }: Props) {
  const [platform, setPlatform] = useState("instagram")
  const [contentType, setContentType] = useState("social_post")
  const [generating, setGenerating] = useState(false)
  const [caption, setCaption] = useState("")
  const [hashtags, setHashtags] = useState<string[]>([])

  async function generate() {
    setGenerating(true)
    const res = await fetch("/api/content-calendar/ai-fill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief_id: briefId, platform, content_type: contentType }),
    })
    const data = await res.json()
    setCaption(data.caption || "")
    setHashtags(data.hashtags || [])
    setGenerating(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-border bg-primary p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /> AI Generate Post</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-muted-foreground">Platform</label>
            <select className="w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm" value={platform} onChange={e => setPlatform(e.target.value)}>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="facebook">Facebook</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-muted-foreground">Content Type</label>
            <select className="w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm" value={contentType} onChange={e => setContentType(e.target.value)}>
              <option value="social_post">Social Post</option>
              <option value="carousel">Carousel</option>
              <option value="video">Video</option>
            </select>
          </div>
        </div>

        {!caption && (
          <button onClick={generate} disabled={generating}
            className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4" /> Generate Caption</>}
          </button>
        )}

        {caption && (
          <>
            <label className="block text-sm font-medium mb-1 text-muted-foreground">Generated Caption (editable)</label>
            <textarea className="w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm min-h-[120px] mb-3" value={caption} onChange={e => setCaption(e.target.value)} />
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {hashtags.map(h => <span key={h} className="rounded-full bg-accent/10 text-accent text-xs px-2 py-0.5">{h}</span>)}
              </div>
            )}
            <button onClick={() => onSchedule(caption)}
              className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors">
              Schedule This Post
            </button>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/calendar/ai-fill-modal.tsx
git commit -m "feat: AI caption generation modal"
```

---

### Task 12: Update ContentBriefs page — AI Generate button

**Files:**
- Modify: `src/app/dashboard/content-briefs/page.tsx`

- [ ] **Replace basic "Schedule to Calendar" with AI Generate button**

Find the "Schedule to Calendar" card section (around lines 223-257). Replace with:

```typescript
// At top of component, add state:
const [aiFillBriefId, setAiFillBriefId] = useState<string | null>(null)
const [showAiModal, setShowAiModal] = useState(false)

// Replace the "Schedule to Calendar" card:
<div className="rounded-xl border border-border bg-card p-4 space-y-3">
  <h3 className="text-sm font-semibold">Publish This Brief</h3>
  <p className="text-xs text-muted-foreground">Generate a social post or schedule directly.</p>
  <button
    onClick={() => { setAiFillBriefId(brief.id); setShowAiModal(true) }}
    className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 w-full justify-center"
  >
    <Sparkles className="h-4 w-4" /> Generate Post
  </button>
  <div className="flex items-center gap-2">
    <input type="date" className="flex-1 rounded-lg border border-border bg-white/5 px-3 py-2 text-sm" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
    <button onClick={handleSchedule} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-white">Add to Calendar</button>
  </div>
</div>

// At bottom of page, add modal:
{showAiModal && aiFillBriefId && (
  <AiFillModal
    briefId={aiFillBriefId}
    onSchedule={async (caption) => {
      // Create calendar entry with AI caption
      const supabase = createClient()
      await supabase.from("content_calendar").insert({
        user_id: user.id,
        title: `Post: ${brief.title}`,
        scheduled_date: scheduleDate || new Date().toISOString().split("T")[0],
        ai_caption: caption,
        ai_generated: true,
        content_brief_id: brief.id,
        status: "draft",
      })
      setShowAiModal(false)
      addToast("Post generated and added to calendar", "success")
    }}
    onClose={() => setShowAiModal(false)}
  />
)}
```

Also add imports at top:
```typescript
import { AiFillModal } from "@/components/calendar/ai-fill-modal"
import { Sparkles } from "lucide-react"
```

- [ ] **Commit**

```bash
git add src/app/dashboard/content-briefs/page.tsx
git commit -m "feat: AI generate post button in content briefs"
```

---

### Task 13: Content Calendar page — tabs + integrate everything

**Files:**
- Modify: `src/components/calendar/content-calendar.tsx`
- Modify: `src/app/dashboard/content-calendar/page.tsx`

- [ ] **Update page to pass view prop**

`src/app/dashboard/content-calendar/page.tsx` — add export for current view if needed. Minimal changes.

- [ ] **Major rewrite of content-calendar.tsx**

This is the biggest task. The component gets tab switching (Calendar/Kanban), EntryForm modal, platform dots on existing grid, and comments panel:

```typescript
"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { ChevronLeft, ChevronRight, Calendar, Columns3, Plus } from "lucide-react"
import { KanbanView } from "./kanban-view"
import { EntryForm } from "./entry-form"
import { CommentsPanel } from "./comments-panel"
import { addToast } from "@/lib/use-toast"

interface CalendarEntry {
  id: string
  title: string
  scheduled_date: string
  status: string
  platform: string[]
  content_type: string | null
  assigned_to: string | null
  [key: string]: any
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E1306C",
  tiktok: "#00F2EA",
  facebook: "#1877F2",
  youtube: "#FF0000",
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const DAYS_SHORT = ["M", "T", "W", "T", "F", "S", "S"]

export function ContentCalendar() {
  const [view, setView] = useState<"calendar" | "kanban">("calendar")
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [entries, setEntries] = useState<CalendarEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [prefillDate, setPrefillDate] = useState("")
  const [selectedEntryForComments, setSelectedEntryForComments] = useState<string | null>(null)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    const month = currentMonth.getMonth() + 1
    const year = currentMonth.getFullYear()
    const res = await fetch(`/api/content-calendar?month=${month}&year=${year}`)
    const data = await res.json()
    setEntries(data.entries || [])
    setLoading(false)
  }, [currentMonth])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  async function handleStatusChange(entryId: string, newStatus: string) {
    const supabase = createClient()
    await supabase.from("content_calendar").update({ status: newStatus }).eq("id", entryId)
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, status: newStatus } : e))
    addToast(`Status changed to ${newStatus}`, "success")
  }

  // Calendar grid helpers
  function getDaysInMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  function getFirstDayOfMonth(date: Date) {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    return day === 0 ? 6 : day - 1 // Monday = 0
  }

  function prevMonth() { setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1)) }
  function nextMonth() { setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1)) }
  function goToday() { setCurrentMonth(new Date()) }

  const today = new Date().toISOString().split("T")[0]
  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDay = getFirstDayOfMonth(currentMonth)

  function getEntriesForDay(day: number): CalendarEntry[] {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return entries.filter(e => e.scheduled_date === dateStr)
  }

  function handleDayClick(day: number) {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    setPrefillDate(dateStr)
    setSelectedEntry(null)
    setShowForm(true)
  }

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          <button onClick={() => setView("calendar")}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${view === "calendar" ? "bg-accent text-white" : "text-muted-foreground hover:text-white"}`}>
            <Calendar className="h-4 w-4" /> Calendar
          </button>
          <button onClick={() => setView("kanban")}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${view === "kanban" ? "bg-accent text-white" : "text-muted-foreground hover:text-white"}`}>
            <Columns3 className="h-4 w-4" /> Kanban
          </button>
        </div>
        {view === "calendar" && (
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="rounded-lg p-1.5 text-muted-foreground hover:text-white"><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-sm font-medium min-w-[140px] text-center">{currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
            <button onClick={nextMonth} className="rounded-lg p-1.5 text-muted-foreground hover:text-white"><ChevronRight className="h-4 w-4" /></button>
            <button onClick={goToday} className="ml-2 rounded-lg border border-border px-3 py-1 text-xs text-muted-foreground hover:text-white">Today</button>
          </div>
        )}
      </div>

      {/* Calendar View */}
      {view === "calendar" && (
        <>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-px">
            {DAYS.map(d => <div key={d} className="hidden sm:block text-center text-xs text-muted-foreground py-2">{d}</div>)}
            {DAYS_SHORT.map(d => <div key={d} className="sm:hidden text-center text-xs text-muted-foreground py-2">{d}</div>)}
          </div>
          {/* Grid */}
          <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="bg-primary/50 min-h-[100px] sm:min-h-[120px]" />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dayEntries = getEntriesForDay(day)
              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              const isToday = dateStr === today
              return (
                <div key={day} onClick={() => handleDayClick(day)}
                  className={`bg-primary min-h-[100px] sm:min-h-[120px] p-1.5 cursor-pointer transition-colors hover:bg-white/5 ${isToday ? "ring-1 ring-accent" : ""}`}>
                  <span className={`text-xs font-medium ${isToday ? "text-accent" : "text-muted-foreground"}`}>{day}</span>
                  {/* Desktop: show up to 3 entries */}
                  <div className="hidden sm:block space-y-0.5 mt-1">
                    {dayEntries.slice(0, 3).map(e => (
                      <div key={e.id} onClick={e => { e.stopPropagation(); setSelectedEntry(e); setShowForm(true) }}
                        className="flex items-center gap-1 rounded px-1 py-0.5 cursor-pointer hover:brightness-110"
                        style={{ backgroundColor: `${PLATFORM_COLORS[e.platform?.[0]] || "#666"}20` }}>
                        {e.platform?.slice(0, 2).map((p: string) => (
                          <span key={p} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[p] || "#666" }} />
                        ))}
                        <span className="text-[10px] truncate flex-1">{e.title}</span>
                      </div>
                    ))}
                    {dayEntries.length > 3 && <span className="text-[10px] text-muted-foreground">+{dayEntries.length - 3} more</span>}
                  </div>
                  {/* Mobile: colored dots */}
                  <div className="sm:hidden flex flex-wrap gap-0.5 mt-1">
                    {dayEntries.map(e => (
                      <span key={e.id} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[e.platform?.[0]] || "#666" }} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Kanban View */}
      {view === "kanban" && (
        <KanbanView
          entries={entries}
          onEntryClick={entry => { setSelectedEntry(entry); setShowForm(true) }}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Entry Form Modal */}
      {showForm && (
        <EntryForm
          entry={selectedEntry || undefined}
          prefill={selectedEntry ? undefined : { title: "", content_brief_id: undefined }}
          onSave={() => { setShowForm(false); setSelectedEntry(null); fetchEntries() }}
          onClose={() => { setShowForm(false); setSelectedEntry(null) }}
        />
      )}
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/calendar/content-calendar.tsx src/app/dashboard/content-calendar/page.tsx
git commit -m "feat: calendar kanban tabs + platform dots + entry form integration"
```

---

### Task 14: Build verification

- [ ] **Run build to verify**

```bash
npm run build 2>&1 | tail -20
```

Expected: 47+ routes, 0 errors.

- [ ] **Fix any type/import errors if build fails**
- [ ] **Commit final fixes**

```bash
git add -A
git commit -m "chore: fix build errors after calendar overhaul"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Migration covers all new columns + comments table. API endpoints cover AI fill, bulk, comments, users. UI components cover entry form, Kanban, comments, AI modal. All sections from the spec have corresponding tasks.
- [ ] **Placeholder scan:** No TBD/TODO/fill-in-later found.
- [ ] **Type consistency:** `CalendarEntry` interface used consistently across EntryForm, KanbanCard, KanbanView, content-calendar.tsx. API response shape matches UI expectations.
