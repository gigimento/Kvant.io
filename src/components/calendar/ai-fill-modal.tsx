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
