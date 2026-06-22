"use client"

import { useState, useEffect, useCallback } from "react"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday, parseISO } from "date-fns"
import { ChevronLeft, ChevronRight, Plus, Trash2, GripVertical, CalendarDays, List } from "lucide-react"
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
  const [mobileView, setMobileView] = useState<"grid" | "list">("list")

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

  const groupedEntries = () => {
    const groups: { date: Date; entries: CalendarEntry[] }[] = []
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    let day = start
    while (day <= end) {
      const dayEntries = entriesForDay(day)
      if (dayEntries.length > 0 || isToday(day)) {
        groups.push({ date: day, entries: dayEntries })
      }
      day = addDays(day, 1)
    }
    return groups
  }

  if (loading) {
    return <div className="space-y-3"><div className="h-8 w-48 skeleton" /><div className="h-64 skeleton-card" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg sm:text-xl font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentMonth(new Date())} className="text-sm text-muted-foreground hover:text-white transition-colors">
            Today
          </button>
          <div className="sm:hidden flex border border-white/10 rounded-lg">
            <button
              onClick={() => setMobileView("list")}
              className={`p-1.5 ${mobileView === "list" ? "bg-accent/20 text-accent" : "text-muted-foreground"}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setMobileView("grid")}
              className={`p-1.5 ${mobileView === "grid" ? "bg-accent/20 text-accent" : "text-muted-foreground"}`}
            >
              <CalendarDays className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="hidden sm:block">
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
                className={`min-h-[80px] lg:min-h-[100px] bg-primary/30 p-1.5 lg:p-2 border border-white/5 transition-colors ${
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
                  {dayEntries.slice(0, 3).map(entry => (
                    <div
                      key={entry.id}
                      className={`px-1.5 py-0.5 rounded text-[10px] lg:text-xs border truncate ${statusColors[entry.status]}`}
                    >
                      {entry.title}
                    </div>
                  ))}
                  {dayEntries.length > 3 && (
                    <div className="text-[10px] text-muted-foreground text-center">
                      +{dayEntries.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className={`sm:hidden space-y-3 ${mobileView === "grid" ? "block" : "hidden sm:block"}`}>
        <div className="grid grid-cols-7 gap-px bg-white/5 rounded-lg overflow-hidden">
          {["M", "T", "W", "T", "F", "S", "S"].map(day => (
            <div key={day} className="bg-primary/50 py-1.5 text-[10px] font-medium text-muted-foreground text-center">
              {day}
            </div>
          ))}
          {daysInMonth().map((date, i) => {
            const dayEntries = entriesForDay(date)
            return (
              <div
                key={i}
                className={`min-h-[44px] bg-primary/30 p-0.5 border border-white/5 transition-colors ${
                  !isSameMonth(date, currentMonth) ? "opacity-20" : ""
                } ${isToday(date) ? "ring-1 ring-accent" : ""}`}
                onClick={() => { setSelectedDate(date); setNewTitle("") }}
              >
                <span className={`text-[10px] font-medium ${isToday(date) ? "text-accent" : "text-muted-foreground"}`}>
                  {format(date, "d")}
                </span>
                {dayEntries.length > 0 && (
                  <div className={`mt-0.5 mx-auto w-1.5 h-1.5 rounded-full ${
                    dayEntries.some(e => e.status === "published") ? "bg-green-400" :
                    dayEntries.some(e => e.status === "scheduled") ? "bg-blue-400" : "bg-yellow-400"
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className={`sm:hidden space-y-2 ${mobileView === "list" ? "block" : "hidden"}`}>
        {groupedEntries().map(({ date, entries: dayEntries }) => (
          <Card key={date.toISOString()}>
            <CardContent className="p-3">
              <div className={`flex items-center justify-between mb-2 ${isToday(date) ? "text-accent" : ""}`}>
                <span className="text-sm font-medium">{format(date, "EEE, MMM d")}</span>
                {dayEntries.length > 0 && (
                  <span className="text-xs text-muted-foreground">{dayEntries.length} entry</span>
                )}
              </div>
              {dayEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground">No entries</p>
              ) : (
                <div className="space-y-1.5">
                  {dayEntries.map(entry => (
                    <div key={entry.id} className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${statusColors[entry.status]}`}>
                        {entry.status}
                      </span>
                      {editingId === entry.id ? (
                        <input
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          onBlur={() => updateEntry(entry.id, { title: editTitle })}
                          onKeyDown={e => e.key === "Enter" && updateEntry(entry.id, { title: editTitle })}
                          className="flex-1 bg-transparent outline-none text-sm"
                          autoFocus
                        />
                      ) : (
                        <span
                          className="flex-1 text-sm truncate"
                          onDoubleClick={() => { setEditingId(entry.id); setEditTitle(entry.title) }}
                        >
                          {entry.title}
                        </span>
                      )}
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="p-1 hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedDate && (
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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
              <div className="flex gap-2">
                <Button size="sm" onClick={() => addEntry(selectedDate)} disabled={!newTitle.trim()} className="flex-1 sm:flex-none">
                  Add
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedDate(null)}>Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
