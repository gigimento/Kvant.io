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

        <label className="block text-sm font-medium mb-1 text-muted-foreground">Title *</label>
        <input className="w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm mb-4" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />

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

        <label className="block text-sm font-medium mb-1 text-muted-foreground">Content Type</label>
        <select className="w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm mb-4" value={form.content_type} onChange={e => setForm(f => ({ ...f, content_type: e.target.value }))}>
          {CONTENT_TYPES.map(ct => <option key={ct.id} value={ct.id}>{ct.label}</option>)}
        </select>

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

        <label className="block text-sm font-medium mb-1 text-muted-foreground">Caption</label>
        <textarea className="w-full rounded-lg border border-border bg-white/5 px-3 py-2 text-sm mb-4 min-h-[100px]" value={form.ai_caption} onChange={e => setForm(f => ({ ...f, ai_caption: e.target.value }))} />

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
