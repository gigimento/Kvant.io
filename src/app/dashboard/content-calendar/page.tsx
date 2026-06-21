import { ContentCalendar } from "@/components/calendar/content-calendar"

export const metadata = { title: "Content Calendar - Kvant" }

export default function ContentCalendarPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Content Calendar</h1>
        <p className="text-muted-foreground">Plan and schedule your content</p>
      </div>
      <ContentCalendar />
    </div>
  )
}
