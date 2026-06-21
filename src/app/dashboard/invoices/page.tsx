"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Download, FileText, Loader2, Trash2 } from "lucide-react"

interface InvoiceItem {
  description: string
  quantity: number
  rate: number
}

interface Invoice {
  id: string
  invoice_number: string
  client_name: string
  client_email: string | null
  items: InvoiceItem[]
  subtotal: number
  tax_rate: number
  total: number
  status: string
  due_date: string | null
  created_at: string
}

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", quantity: 1, rate: 0 }])
  const [taxRate, setTaxRate] = useState("0")
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return }
      fetchInvoices()
    })
  }, [])

  async function fetchInvoices() {
    const res = await fetch("/api/invoices")
    const data = await res.json()
    if (data.success) setInvoices(data.invoices)
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_name: clientName,
        client_email: clientEmail || undefined,
        items: items.filter(i => i.description.trim()),
        tax_rate: parseFloat(taxRate) || 0,
        due_date: dueDate || undefined,
        notes: notes || undefined,
      }),
    })
    const data = await res.json()
    if (data.success) {
      setInvoices(prev => [data.invoice, ...prev])
      setShowForm(false)
      resetForm()
    }
    setSaving(false)
  }

  function resetForm() {
    setClientName(""); setClientEmail(""); setItems([{ description: "", quantity: 1, rate: 0 }])
    setTaxRate("0"); setDueDate(""); setNotes("")
  }

  async function deleteInvoice(id: string) {
    await fetch(`/api/invoices/${id}`, { method: "DELETE" })
    setInvoices(prev => prev.filter(i => i.id !== id))
  }

  function addItem() { setItems(prev => [...prev, { description: "", quantity: 1, rate: 0 }]) }

  function updateItem(index: number, field: keyof InvoiceItem, value: string | number) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const statusColors: Record<string, string> = {
    draft: "text-yellow-400", sent: "text-blue-400", paid: "text-green-400", cancelled: "text-muted-foreground",
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Create and manage client invoices</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "New Invoice"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>New Invoice</CardTitle><CardDescription>Fill in the details below</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client Name *</Label>
                  <Input value={clientName} onChange={e => setClientName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Client Email</Label>
                  <Input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Line Items</Label>
                {items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <Input placeholder="Description" value={item.description} onChange={e => updateItem(i, "description", e.target.value)} className="flex-[3]" />
                    <Input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, "quantity", parseInt(e.target.value) || 1)} className="flex-1" />
                    <Input type="number" min="0" step="0.01" placeholder="Rate" value={item.rate} onChange={e => updateItem(i, "rate", parseFloat(e.target.value) || 0)} className="flex-1" />
                    <span className="flex items-center text-sm text-muted-foreground w-20">${(item.quantity * item.rate).toFixed(2)}</span>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="p-2 text-red-400 hover:text-red-300">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addItem} className="text-sm text-accent hover:underline">+ Add item</button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tax Rate (%)</Label>
                  <Input type="number" min="0" step="0.1" value={taxRate} onChange={e => setTaxRate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Total</Label>
                  <div className="flex h-10 items-center text-lg font-bold text-accent">
                    ${items.reduce((s, i) => s + i.quantity * i.rate, 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={saving || !clientName || items.every(i => !i.description)}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                {saving ? "Creating..." : "Create Invoice"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {invoices.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">No invoices yet. Create your first one.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => (
            <Card key={inv.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <FileText className="h-8 w-8 text-accent/50" />
                  <div>
                    <p className="font-medium">{inv.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">{inv.client_name}</p>
                  </div>
                  <span className={`text-xs font-medium capitalize ${statusColors[inv.status] || ""}`}>{inv.status}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-accent">${inv.total.toFixed(2)}</span>
                  <a href={`/api/invoices/${inv.id}/pdf`} target="_blank" className="text-muted-foreground hover:text-white transition-colors">
                    <Download className="h-4 w-4" />
                  </a>
                  <button onClick={() => deleteInvoice(inv.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
