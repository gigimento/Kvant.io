import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer"

Font.register({
  family: "Outfit",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/outfit/v11/QGYvz_MVcBeNP4NJtEtqU1xnoQ.woff2",
      fontWeight: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/outfit/v11/QGYvz_MVcBeNP4NJtEtqU1xnoQ.woff2",
      fontWeight: "bold",
    },
  ],
})

const COLORS = {
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  headerBg: "#27262E",
  accent: "#E19C63",
  secondary: "#8BA5BE",
  fg: "#1F2937",
  muted: "#6B7280",
  border: "#E5E7EB",
  green: "#10B981",
  red: "#EF4444",
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Outfit",
    backgroundColor: COLORS.bg,
  },
  headerBar: {
    backgroundColor: COLORS.headerBg,
    padding: 24,
    marginBottom: 24,
    borderRadius: 4,
  },
  companyName: {
    color: COLORS.accent,
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  reportTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    marginTop: 6,
    opacity: 0.9,
  },
  generatedDate: {
    color: COLORS.secondary,
    fontSize: 9,
    marginTop: 4,
  },
  sectionTitle: {
    color: COLORS.headerBg,
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
    marginTop: 20,
    borderBottom: `1px solid ${COLORS.border}`,
    paddingBottom: 6,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.7,
    color: COLORS.fg,
    marginBottom: 16,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
    marginTop: 8,
  },
  kpiCard: {
    width: "46%",
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 4,
    border: `1px solid ${COLORS.border}`,
  },
  kpiLabel: {
    fontSize: 8,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.fg,
  },
  kpiChange: {
    fontSize: 8,
    marginTop: 2,
  },
  progressBarOuter: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginTop: 8,
    overflow: "hidden",
  },
  progressBarInner: {
    height: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 4,
  },
  table: {
    marginTop: 8,
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 6,
  },
  tableHeader: {
    backgroundColor: COLORS.headerBg,
    borderBottomWidth: 0,
    paddingVertical: 8,
    borderRadius: 2,
  },
  tableCellLabel: {
    flex: 1,
    fontSize: 9,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  tableCellValue: {
    width: 80,
    fontSize: 9,
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "right",
  },
  cellLabel: {
    flex: 1,
    fontSize: 9,
    color: COLORS.fg,
  },
  cellValue: {
    width: 80,
    fontSize: 9,
    color: COLORS.fg,
    textAlign: "right",
  },
  sourceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sourceName: {
    fontSize: 9,
    color: COLORS.fg,
    flex: 1,
  },
  sourceValue: {
    fontSize: 9,
    color: COLORS.fg,
    width: 60,
    textAlign: "right",
  },
  sourceBar: {
    width: 80,
    marginLeft: 8,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.accent,
    marginVertical: 20,
    opacity: 0.3,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    color: COLORS.secondary,
    fontSize: 8,
    letterSpacing: 1,
  },
})

interface ReportPDFProps {
  report: {
    client_name: string
    period_start: string
    period_end: string
    narrative_text: string
    raw_data?: any
    created_at: string
  }
}

function formatNum(n: number): string {
  return n?.toLocaleString() ?? "—"
}

export function ReportPDF({ report }: ReportPDFProps) {
  const metrics = report.raw_data?.metrics || {}
  const maxSource = metrics.sessionsBySource
    ? Math.max(...metrics.sessionsBySource.map((s: any) => s.sessions), 1)
    : 1

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBar}>
          <Text style={styles.companyName}>KVANT</Text>
          <Text style={styles.reportTitle}>Client Narrative Report — {report.client_name}</Text>
          <Text style={styles.generatedDate}>
            {report.period_start} – {report.period_end} &nbsp;·&nbsp; Generated{" "}
            {new Date(report.created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <Text style={styles.body}>{report.narrative_text}</Text>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Key Metrics</Text>

        {metrics.sessions !== undefined && (
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Sessions</Text>
              <Text style={styles.kpiValue}>{formatNum(metrics.sessions)}</Text>
              {metrics.sessionsChange !== undefined && (
                <Text style={[styles.kpiChange, { color: metrics.sessionsChange >= 0 ? COLORS.green : COLORS.red }]}>
                  {metrics.sessionsChange >= 0 ? "+" : ""}{metrics.sessionsChange}%
                </Text>
              )}
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Users</Text>
              <Text style={styles.kpiValue}>{formatNum(metrics.users)}</Text>
              {metrics.usersChange !== undefined && (
                <Text style={[styles.kpiChange, { color: metrics.usersChange >= 0 ? COLORS.green : COLORS.red }]}>
                  {metrics.usersChange >= 0 ? "+" : ""}{metrics.usersChange}%
                </Text>
              )}
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Pageviews</Text>
              <Text style={styles.kpiValue}>{formatNum(metrics.pageviews)}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Bounce Rate</Text>
              <Text style={styles.kpiValue}>{metrics.bounceRate}%</Text>
            </View>
          </View>
        )}

        {metrics.topPages?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Top Pages</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCellLabel}>Page</Text>
                <Text style={styles.tableCellValue}>Views</Text>
              </View>
              {metrics.topPages.map((page: any, i: number) => (
                <View style={styles.tableRow} key={i}>
                  <Text style={styles.cellLabel}>{page.path}</Text>
                  <Text style={styles.cellValue}>{formatNum(page.views)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {metrics.sessionsBySource?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Traffic Sources</Text>
            {metrics.sessionsBySource.map((s: any, i: number) => {
              const share = (s.sessions / maxSource) * 100
              return (
                <View style={styles.sourceRow} key={i}>
                  <Text style={styles.sourceName}>{s.source}</Text>
                  <View style={styles.sourceBar}>
                    <View style={styles.progressBarOuter}>
                      <View style={[styles.progressBarInner, { width: `${share}%` }]} />
                    </View>
                  </View>
                  <Text style={styles.sourceValue}>{formatNum(s.sessions)}</Text>
                </View>
              )
            })}
          </>
        )}

        <Text style={styles.footer}>GENERATED BY KVANT — AI-POWERED CLIENT REPORTS</Text>
      </Page>
    </Document>
  )
}
