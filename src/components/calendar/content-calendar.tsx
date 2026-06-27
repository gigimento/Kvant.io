"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { ChevronLeft, ChevronRight, Calendar, Columns3 } from "lucide-react"
import { KanbanView } from "./kanban-view"
import { EntryForm } from "./entry-form"
import { useToast } from "@/lib/use-toast"

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E1306C",
  tiktok: "#00F2EA",
  facebook: "#1877F2",
  youtube: "#FF0000",
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const DAYS_SHORT = ["M", "T", "W", "T", "F", "S", "S"]

export function ContentCalendar() {
  const { addToast } = useToast()
  const [view, setView] = useState<"calendar" | "kanban">("calendar")
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [prefillDate, setPrefillDate] = useState("")

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

  function getDaysInMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  function getFirstDayOfMonth(date: Date) {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    return day === 0 ? 6 : day - 1
  }

  function prevMonth() { setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1)) }
  function nextMonth() { setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1)) }
  function goToday() { setCurrentMonth(new Date()) }

  const today = new Date().toISOString().split("T")[0]
  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDay = getFirstDayOfMonth(currentMonth)

  function getEntriesForDay(day: number) {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return entries.filter(e => e.scheduled_date === dateStr)
  }

  function handleDayClick(day: number) {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    setPrefillDate(dateStr)
    setSelectedEntry(null)
    setShowForm(true)
  }

  if (loading) {
    return <div className="space-y-3"><div className="h-8 w-48 skeleton" /><div className="h-64 skeleton-card" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          <button onClick={() => setView("calendar")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${view === "calendar" ? "bg-accent text-white" : "text-muted-foreground hover:text-white"}`}>
            <Calendar className="h-4 w-4" /> <span className="hidden xs:inline">Calendar</span>
          </button>
          <button onClick={() => setView("kanban")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${view === "kanban" ? "bg-accent text-white" : "text-muted-foreground hover:text-white"}`}>
            <Columns3 className="h-4 w-4" /> <span className="hidden xs:inline">Kanban</span>
          </button>
        </div>
        {view === "calendar" && (
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={prevMonth} className="rounded-lg p-1.5 text-muted-foreground hover:text-white"><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-sm font-medium min-w-[120px] sm:min-w-[140px] text-center">{currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
            <button onClick={nextMonth} className="rounded-lg p-1.5 text-muted-foreground hover:text-white"><ChevronRight className="h-4 w-4" /></button>
            <button onClick={goToday} className="ml-1 sm:ml-2 rounded-lg border border-border px-2 sm:px-3 py-1 text-xs text-muted-foreground hover:text-white">Today</button>
          </div>
        )}
      </div>

      {view === "calendar" && (
        <>
          <div className="grid grid-cols-7 gap-px">
            {DAYS.map(d => <div key={d} className="hidden sm:block text-center text-xs text-muted-foreground py-2">{d}</div>)}
            {DAYS_SHORT.map(d => <div key={d} className="sm:hidden text-center text-xs text-muted-foreground py-2">{d}</div>)}
          </div>
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
                  <div className="hidden sm:block space-y-0.5 mt-1">
                    {dayEntries.slice(0, 3).map(e => (
                      <div key={e.id} onClick={ev => { ev.stopPropagation(); setSelectedEntry(e); setShowForm(true) }}
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

      {view === "kanban" && (
        <KanbanView
          entries={entries}
          onEntryClick={entry => { setSelectedEntry(entry); setShowForm(true) }}
          onStatusChange={handleStatusChange}
        />
      )}

      {showForm && (
        <EntryForm
          entry={selectedEntry || undefined}
          onSave={() => { setShowForm(false); setSelectedEntry(null); fetchEntries() }}
          onClose={() => { setShowForm(false); setSelectedEntry(null) }}
        />
      )}
    </div>
  )
}
