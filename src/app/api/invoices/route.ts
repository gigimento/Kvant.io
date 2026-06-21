import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkServerAccess } from "@/lib/subscription-guard"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const access = await checkServerAccess()
    if (!access.allowed) return NextResponse.json({ error: "Subscription required" }, { status: 402 })

    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, invoices: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { client_name, client_email, items, tax_rate, due_date, notes } = body
    if (!client_name || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "client_name and items are required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const access = await checkServerAccess()
    if (!access.allowed) return NextResponse.json({ error: "Subscription required" }, { status: 402 })

    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity || 1) * (item.rate || 0), 0)
    const taxAmount = subtotal * ((tax_rate || 0) / 100)
    const total = subtotal + taxAmount

    const { count } = await supabase.from("invoices").select("*", { count: "exact", head: true }).eq("user_id", user.id)
    const invoiceNumber = `INV-${String((count || 0) + 1).padStart(4, "0")}`

    const { data, error } = await supabase
      .from("invoices")
      .insert({
        user_id: user.id, invoice_number: invoiceNumber, client_name, client_email: client_email || null,
        items, subtotal, tax_rate: tax_rate || 0, tax_amount: taxAmount, total,
        due_date: due_date || null, notes: notes || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, invoice: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
