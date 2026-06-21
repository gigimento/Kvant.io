"use client"

import { useState, useEffect, useCallback } from "react"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday } from "date-fns"
import { ChevronLeft, ChevronRight, Plus, Trash2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

interface CalendarEntry {
  id: string
  title: string
  scheduled_date: string
  status: "draft" | "scheduled" | "published"
  content_brief_id: string | null
  notes: string | null
}

export function ContentCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [entries, setEntries] = useState<CalendarEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const fetchEntries = useCallback(async () => {
    const month = format(currentMonth, "M")
    const year = format(currentMonth, "yyyy")
    const res = await fetch(`/api/content-calendar?month=${month}&year=${year}`)
    const data = await res.json()
    if (data.success) setEntries(data.entries)
    setLoading(false)
  }, [currentMonth])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  async function addEntry(date: Date) {
    if (!newTitle.trim()) return
    const res = await fetch("/api/content-calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim(), scheduled_date: format(date, "yyyy-MM-dd") }),
    })
    const data = await res.json()
    if (data.success) {
      setEntries(prev => [...prev, data.entry])
      setNewTitle("")
      setSelectedDate(null)
    }
  }

  async function updateEntry(id: string, updates: Partial<CalendarEntry>) {
    const res = await fetch(`/api/content-calendar/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
    const data = await res.json()
    if (data.success) {
      setEntries(prev => prev.map(e => e.id === id ? data.entry : e))
      setEditingId(null)
    }
  }

  async function deleteEntry(id: string) {
    await fetch(`/api/content-calendar/${id}`, { method: "DELETE" })
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  async function moveEntry(id: string, newDate: Date) {
    const res = await fetch(`/api/content-calendar/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduled_date: format(newDate, "yyyy-MM-dd") }),
    })
    const data = await res.json()
    if (data.success) {
      setEntries(prev => prev.map(e => e.id === id ? data.entry : e))
    }
    setDraggedId(null)
  }

  const statusColors: Record<string, string> = {
    draft: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    published: "bg-green-500/20 text-green-400 border-green-500/30",
  }

  const daysInMonth = () => {
    const start = startOfWeek(startOfMonth(currentMonth))
    const end = endOfWeek(endOfMonth(currentMonth))
    const days: Date[] = []
    let day = start
    while (day <= end) {
      days.push(day)
      day = addDays(day, 1)
    }
    return days
  }

  const entriesForDay = (date: Date) =>
    entries.filter(e => isSameDay(new Date(e.scheduled_date), date))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <button onClick={() => setCurrentMonth(new Date())} className="text-sm text-muted-foreground hover:text-white transition-colors">
          Today
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-white/5 rounded-lg overflow-hidden">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
          <div key={day} className="bg-primary/50 px-3 py-2 text-xs font-medium text-muted-foreground text-center">
            {day}
          </div>
        ))}
        {daysInMonth().map((date, i) => {
          const dayEntries = entriesForDay(date)
          return (
            <div
              key={i}
              className={`min-h-[100px] bg-primary/30 p-2 border border-white/5 transition-colors ${
                !isSameMonth(date, currentMonth) ? "opacity-30" : ""
              } ${isToday(date) ? "ring-1 ring-accent" : ""}`}
              onDragOver={e => { e.preventDefault(); setDraggedId(null) }}
              onDrop={e => {
                e.preventDefault()
                const id = e.dataTransfer.getData("text/calendar-id")
                if (id) moveEntry(id, date)
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium ${isToday(date) ? "text-accent" : "text-muted-foreground"}`}>
                  {format(date, "d")}
                </span>
                {isSameMonth(date, currentMonth) && (
                  <button
                    onClick={() => { setSelectedDate(date); setNewTitle("") }}
                    className="opacity-0 hover:opacity-100 transition-opacity p-0.5 hover:bg-white/10 rounded"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {dayEntries.map(entry => (
                  <div
                    key={entry.id}
                    draggable
                    onDragStart={e => {
                      setDraggedId(entry.id)
                      e.dataTransfer.setData("text/calendar-id", entry.id)
                    }}
                    className={`group flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border cursor-grab active:cursor-grabbing ${
                      statusColors[entry.status]
                    }`}
                  >
                    {editingId === entry.id ? (
                      <input
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onBlur={() => updateEntry(entry.id, { title: editTitle })}
                        onKeyDown={e => e.key === "Enter" && updateEntry(entry.id, { title: editTitle })}
                        className="flex-1 bg-transparent outline-none text-xs"
                        autoFocus
                      />
                    ) : (
                      <span
                        className="flex-1 truncate"
                        onDoubleClick={() => { setEditingId(entry.id); setEditTitle(entry.title) }}
                      >
                        {entry.title}
                      </span>
                    )}
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-black/20 rounded"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {selectedDate && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                Add entry for <span className="text-white font-medium">{format(selectedDate, "MMMM d, yyyy")}</span>
              </p>
              <Input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Entry title..."
                className="flex-1"
                onKeyDown={e => e.key === "Enter" && addEntry(selectedDate)}
                autoFocus
              />
              <Button size="sm" onClick={() => addEntry(selectedDate)} disabled={!newTitle.trim()}>
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedDate(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
