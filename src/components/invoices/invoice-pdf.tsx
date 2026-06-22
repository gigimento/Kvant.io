import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"

interface InvoiceItem {
  description: string
  quantity: number
  rate: number
}

interface InvoiceData {
  invoice_number: string
  client_name: string
  client_email: string | null
  items: InvoiceItem[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  status: string
  due_date: string | null
  created_at: string
}

interface BrandSettings {
  company_name?: string
  logo_url?: string
  primary_color?: string
  accent_color?: string
  secondary_color?: string
}

interface InvoicePDFProps {
  invoice: InvoiceData
  brand?: BrandSettings
}

export function InvoicePDF({ invoice, brand = {} }: InvoicePDFProps) {
  const primary = brand.primary_color || "#27262E"
  const accent = brand.accent_color || "#E19C63"
  const secondary = brand.secondary_color || "#8BA5BE"
  const companyName = brand.company_name || "Kvant"
  const logoUrl = brand.logo_url || null

  const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: "Helvetica" },
    headerBar: { backgroundColor: primary, padding: 20, marginBottom: 24, flexDirection: "row", alignItems: "center", gap: 12 },
    logo: { width: 40, height: 40, objectFit: "contain" },
    headerText: { flex: 1 },
    companyName: { color: accent, fontSize: 18, fontWeight: "bold" },
    invoiceTitle: { color: "#FFFFFF", fontSize: 12, marginTop: 4 },
    row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
    section: { flex: 1 },
    label: { color: secondary, fontSize: 9, marginBottom: 4 },
    value: { color: primary, fontSize: 11 },
    tableHeader: { flexDirection: "row", backgroundColor: primary, padding: 8 },
    tableHeaderText: { color: "#FFFFFF", fontSize: 9, fontWeight: "bold", flex: 1 },
    tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#E5E7EB", padding: 8 },
    tableCell: { fontSize: 9, flex: 1, color: primary },
    tableCellRight: { fontSize: 9, flex: 1, textAlign: "right", color: primary },
    totalsSection: { marginTop: 24, alignItems: "flex-end" },
    totalRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 4 },
    totalLabel: { fontSize: 10, color: secondary, width: 80 },
    totalValue: { fontSize: 10, color: primary, width: 80, textAlign: "right" },
    grandTotal: { fontSize: 14, fontWeight: "bold", color: accent, marginTop: 8 },
    footer: { position: "absolute", bottom: 40, left: 40, right: 40, textAlign: "center", color: secondary, fontSize: 8, borderTopWidth: 1, borderTopColor: "#E5E7EB", paddingTop: 12 },
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBar}>
          {logoUrl && <Image style={styles.logo} src={logoUrl} />}
          <View style={styles.headerText}>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.invoiceTitle}>INVOICE {invoice.invoice_number}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.section}>
            <Text style={styles.label}>BILL TO</Text>
            <Text style={styles.value}>{invoice.client_name}</Text>
            {invoice.client_email && <Text style={styles.value}>{invoice.client_email}</Text>}
          </View>
          <View style={[styles.section, { alignItems: "flex-end" }]}>
            <Text style={styles.label}>INVOICE DATE</Text>
            <Text style={styles.value}>{new Date(invoice.created_at).toLocaleDateString("en-US")}</Text>
            {invoice.due_date && <Text style={[styles.label, { marginTop: 8 }]}>DUE DATE</Text>}
            {invoice.due_date && <Text style={styles.value}>{new Date(invoice.due_date).toLocaleDateString("en-US")}</Text>}
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Description</Text>
          <Text style={styles.tableHeaderText}>Qty</Text>
          <Text style={styles.tableHeaderText}>Rate</Text>
          <Text style={styles.tableHeaderText}>Amount</Text>
        </View>

        {invoice.items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 2 }]}>{item.description}</Text>
            <Text style={styles.tableCellRight}>{item.quantity}</Text>
            <Text style={styles.tableCellRight}>${item.rate.toFixed(2)}</Text>
            <Text style={styles.tableCellRight}>${(item.quantity * item.rate).toFixed(2)}</Text>
          </View>
        ))}

        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${invoice.subtotal.toFixed(2)}</Text>
          </View>
          {invoice.tax_rate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({invoice.tax_rate}%)</Text>
              <Text style={styles.totalValue}>${invoice.tax_amount.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.grandTotal}>Total</Text>
            <Text style={styles.grandTotal}>${invoice.total.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>{companyName} — kvantio.vercel.app</Text>
      </Page>
    </Document>
  )
}
