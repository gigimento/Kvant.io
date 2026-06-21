import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { renderToStream } from "@react-pdf/renderer"
import { ReportPDF } from "@/components/reports/report-pdf"

export async function GET(request: Request, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const { reportId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: report, error } = await supabase
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single()

    if (error || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    if (report.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const stream = await renderToStream(<ReportPDF report={report} />)
    const chunks: Buffer[] = []
    for await (const chunk of stream as any) {
      chunks.push(Buffer.from(chunk))
    }
    const pdfBuffer = Buffer.concat(chunks)

    const config = await supabase
      .from("report_configs")
      .select("name")
      .eq("id", report.config_id)
      .single()

    const slug = config.data?.name
      ? config.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      : "report"

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="report-${slug}.pdf"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
