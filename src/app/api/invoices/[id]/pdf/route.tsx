import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { renderToStream } from "@react-pdf/renderer"
import { InvoicePDF } from "@/components/invoices/invoice-pdf"
import { checkServerAccess } from "@/lib/subscription-guard"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const access = await checkServerAccess()
    if (!access.allowed) return NextResponse.json({ error: "Subscription required" }, { status: 402 })

    const { data: invoice, error } = await supabase.from("invoices").select("*").eq("id", id).eq("user_id", user.id).single()
    if (error || !invoice) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const stream = await renderToStream(<InvoicePDF invoice={invoice} />)
    const chunks: Uint8Array[] = []
    for await (const chunk of stream as any) { chunks.push(chunk) }
    const pdfBuffer = Buffer.concat(chunks)

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
