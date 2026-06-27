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
    <div className="overflow-x-auto pb-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 min-h-[60vh] min-w-[600px]">
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
    </div>
  )
}
