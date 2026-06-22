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
